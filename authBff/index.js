require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const Redis = require("ioredis"); // per Redis (opzionale)

// CONFIG
const PORT = process.env.PORT || 3001;
const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

const KEYCLOAK_TOKEN_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
const KEYCLOAK_INTROSPECT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`;
const KEYCLOAK_LOGOUT_URL = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`;
const JWKS_URI = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`;

const REDIS_URL = process.env.REDIS_URL || null;
const JWKS_REFRESH_INTERVAL_MS = parseInt(process.env.JWKS_REFRESH_INTERVAL_MS || `${10 * 60 * 1000}`, 10); // 10min default
const SESSION_CLEANUP_INTERVAL_MS = parseInt(process.env.SESSION_CLEANUP_INTERVAL_MS || `${15 * 60 * 1000}`, 10); // 15min

// === Redis (opzionale) con fallback in-memory ===
let redis = null;
let useRedis = false;
if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL);
    useRedis = true;
    redis.on("error", (e) => {
      console.warn("⚠️ Redis error:", e.message);
      useRedis = false;
    });
  } catch (err) {
    console.warn("⚠️ Impossibile connettersi a Redis, userò fallback in-memory:", err.message);
    useRedis = false;
  }
}
const inMemoryRevoked = new Map(); // jti -> expiryTimestamp(ms)

// helper per revoca
async function revokeSetAdd(jti, ttlSeconds) {
  if (!jti) return;
  if (useRedis) {
    try {
      await redis.set(`revoked:${jti}`, "1", "EX", ttlSeconds);
      return;
    } catch (err) {
      console.warn("⚠️ Redis set failed, falling back to memory:", err.message);
    }
  }
  // fallback in-memory (store expiry)
  const now = Date.now();
  inMemoryRevoked.set(jti, now + ttlSeconds * 1000);
}

async function revokeSetHas(jti) {
  if (!jti) return false;
  if (useRedis) {
    try {
      const v = await redis.get(`revoked:${jti}`);
      return !!v;
    } catch (err) {
      console.warn("⚠️ Redis get failed, fallback to memory:", err.message);
    }
  }
  const expiry = inMemoryRevoked.get(jti);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    inMemoryRevoked.delete(jti);
    return false;
  }
  return true;
}

// === JWKS client con cache ===
const jwks = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000, // 10 min
  rateLimit: true,
});

// helper per jwt.verify con jwks-rsa
function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Pre-warm JWKS cache (chiamata fetch)
async function refreshJwksCache() {
  try {
    console.log("♻️  Aggiornamento JWKS cache...");
    await axios.get(JWKS_URI, { timeout: 5000 });
    console.log("✅ JWKS fetched");
  } catch (err) {
    console.warn("⚠️ Errore fetching JWKS:", err.message);
  }
}

// Introspect token (usato per refresh/logout)
async function introspectToken(token) {
  try {
    const resp = await axios.post(
      KEYCLOAK_INTROSPECT_URL,
      new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        token,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return resp.data; // { active, exp, ... , jti? }
  } catch (err) {
    console.warn("⚠️ Introspection failed:", err.message);
    return null;
  }
}

// === EXPRESS SETUP ===
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://frontend.localhost",
    credentials: true,
  })
);

// logging (non sensibile)
app.use((req, res, next) => {
  console.log(`➡️  [${req.method}] ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = "***";
    if (safeBody.client_secret) safeBody.client_secret = "***";
    console.log("   📦 Body:", safeBody);
  }
  next();
});

// cookie options
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// === LOGIN ===
app.post("/authBff/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔑 Login attempt for user: ${username}`);
  try {
    const response = await axios.post(
      KEYCLOAK_TOKEN_URL,
      new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        grant_type: "password", // idealmente Authorization Code + PKCE
        username,
        password,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // decode access token to get jti and exp
    const decoded = jwt.decode(access_token);
    const accessJti = decoded && decoded.jti;
    const exp = decoded && decoded.exp; // epoch seconds

    // introspect refresh token to get jti/exp if available
    const intros = await introspectToken(refresh_token);

    // store refresh token jti in revocation store? no, only store when revoked or on logout
    // set cookies
    res.cookie("access_token", access_token, {
      ...cookieOptions,
      maxAge: expires_in * 1000,
    });
    res.cookie("refresh_token", refresh_token, cookieOptions);

    // Optionally keep a session mapping (e.g. user->refresh_jti) in Redis for cleanup / forced logout
    if (intros && intros.active && intros.jti) {
      const sessionKey = `session:${decoded.sub}`; // simplistic - one session per user; adapt if multiple sessions allowed
      if (useRedis) {
        await redis.hset(sessionKey, "refresh_jti", intros.jti, "exp", intros.exp || 0);
        // set TTL to refresh token expiry
        if (intros.exp) {
          const ttl = intros.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await redis.expire(sessionKey, ttl);
        }
      } else {
        // fallback: store in-memory small map if needed
        inMemoryRevoked.set(`session:${decoded.sub}`, { refresh_jti: intros.jti, exp: (intros.exp || 0) * 1000 });
      }
    }

    console.log(`✅ Login success for user: ${username}`);
    res.json({ ok: true, expires_in });
  } catch (err) {
    console.error(`❌ Login failed for user: ${username}`, err.message);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// === REFRESH TOKEN ===
app.post("/authBff/refresh", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });

  console.log("♻️  Refresh token attempt");
  try {
    const response = await axios.post(
      KEYCLOAK_TOKEN_URL,
      new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

    // decode access token
    const decoded = jwt.decode(access_token);
    const accessJti = decoded && decoded.jti;
    const accessExp = decoded && decoded.exp;

    // introspect new refresh token if possible to get jti/exp
    const intros = await introspectToken(newRefreshToken);

    // rotate: optionally revoke old refresh token by introspecting old one
    const oldIntros = await introspectToken(refreshToken);
    if (oldIntros && oldIntros.active && oldIntros.jti && oldIntros.exp) {
      const ttlSeconds = Math.max(1, oldIntros.exp - Math.floor(Date.now() / 1000));
      await revokeSetAdd(oldIntros.jti, ttlSeconds);
      console.log("🔐 Old refresh token marked revoked (rotation).");
    }

    // set new cookies
    res.cookie("access_token", access_token, {
      ...cookieOptions,
      maxAge: expires_in * 1000,
    });
    res.cookie("refresh_token", newRefreshToken, cookieOptions);

    // Optionally save session mapping for new refresh_jti
    if (intros && intros.active && intros.jti) {
      const sessionKey = `session:${decoded.sub}`;
      if (useRedis) {
        await redis.hset(sessionKey, "refresh_jti", intros.jti, "exp", intros.exp || 0);
        if (intros.exp) {
          const ttl = intros.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await redis.expire(sessionKey, ttl);
        }
      } else {
        inMemoryRevoked.set(`session:${decoded.sub}`, { refresh_jti: intros.jti, exp: (intros.exp || 0) * 1000 });
      }
    }

    console.log("✅ Token refresh success");
    res.json({ ok: true, expires_in });
  } catch (err) {
    console.error("❌ Refresh token failed:", err.message);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// === LOGOUT ===
app.post("/authBff/logout", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  const accessToken = req.cookies.access_token;
  console.log("🚪 Logout request");
  try {
    if (refreshToken) {
      // Call Keycloak logout endpoint
      await axios.post(
        KEYCLOAK_LOGOUT_URL,
        new URLSearchParams({
          client_id: KEYCLOAK_CLIENT_ID,
          client_secret: KEYCLOAK_CLIENT_SECRET,
          refresh_token: refreshToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      // Introspect refresh token to get jti/exp and mark revoked locally (so immediate rejection)
      const intros = await introspectToken(refreshToken);
      if (intros && intros.jti) {
        const ttl = intros.exp ? Math.max(1, intros.exp - Math.floor(Date.now() / 1000)) : 60;
        await revokeSetAdd(intros.jti, ttl);
      }
    }

    // Revoke access token jti locally (if present)
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded && decoded.jti && decoded.exp) {
        const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        await revokeSetAdd(decoded.jti, ttl);
      }
    }

    console.log("✅ Logout success (local revocation applied)");
  } catch (err) {
    console.warn("⚠️  Logout Keycloak non completato:", err.message);
  } finally {
    // Clear cookies and return
    res.setHeader("Cache-Control", "no-store");
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ ok: true });
  }
});

// === AUTH MIDDLEWARE (per endpoint che rilasciano token o per whoami) ===
function authMiddleware(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, async (err, decoded) => {
    if (err) {
      // if expired, tell frontend to call refresh (or BFF could auto-refresh here)
      console.warn("JWT invalid or expired:", err.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // check if jti is revoked
    const jti = decoded.jti;
    const isRevoked = await revokeSetHas(jti);
    if (isRevoked) {
      console.warn("⚠️ Token revoked (jti):", jti);
      return res.status(401).json({ error: "Token revoked" });
    }

    req.user = decoded;
    console.log(`✅ Authenticated request from user: ${decoded.preferred_username || decoded.sub}`);
    next();
  });
}

// === API DI TEST PROTETTA (esempio per whoami) ===
app.get("/api/whoami", authMiddleware, (req, res) => {
  res.json({
    message: "Authenticated user",
    user: req.user,
  });
});

// === METRICS / HEALTH (semplici) ===
app.get("/health", (req, res) => res.json({ ok: true }));
// (aggiungere /metrics Prometheus se vuoi)

// === BACKGROUND JOBS ===

// 1) JWKS refresh
setInterval(() => {
  refreshJwksCache().catch((e) => console.warn("JWKS refresh error:", e.message));
}, JWKS_REFRESH_INTERVAL_MS);

// 2) Session cleanup for in-memory store (Redis TTL auto pulisce)
setInterval(() => {
  if (!useRedis) {
    const now = Date.now();
    for (const [k, v] of inMemoryRevoked.entries()) {
      // v could be expiryTimestamp or an object (session storage)
      if (typeof v === "number") {
        if (v < now) inMemoryRevoked.delete(k);
      } else if (v && v.exp && v.exp < now) {
        inMemoryRevoked.delete(k);
      }
    }
    // optionally log current memory size
    if (inMemoryRevoked.size > 0) {
      console.log(`🧹 In-memory revocation store size: ${inMemoryRevoked.size}`);
    }
  } else {
    // Redis auto-expire keys via EX set earlier; could perform additional cleanup/metrics here
    // e.g., count keys: redis.keys("revoked:*").then(console.log).catch(()=>{})
  }
}, SESSION_CLEANUP_INTERVAL_MS);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BFF running on port ${PORT}`);
  // initial JWKS warm-up
  refreshJwksCache().catch(() => {});
});
