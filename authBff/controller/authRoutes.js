const express = require("express");
const { login, refresh, logout, introspectToken } = require("../services/keycloakService");
const { recordLogin, getLastLogins } = require("../session/session.js");
const { redis, useRedis } = require("../config/redis.js");
const { revokeSetAdd } = require("../services/revocationService");

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none",
  domain: ".local.test",
  path: "/",
};

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await login(username, password);

    // set cookies
    res.cookie("access_token", result.access_token, { ...cookieOptions, maxAge: result.expires_in * 1000 });
    res.cookie("refresh_token", result.refresh_token, cookieOptions);

    // registra login in Redis
    if (result.userProfile?.sub) {
      await recordLogin(result.userProfile.sub);
    }

    // session info
    const lastLogins = result.userProfile?.sub ? await getLastLogins(result.userProfile.sub) : [];

    // salva session mapping refresh_jti in Redis
    if (result.intros?.active && result.intros.jti) {
      const sessionKey = `session:${result.userProfile.sub}`;
      if (useRedis) {
        await redis.hset(sessionKey, "refresh_jti", result.intros.jti, "exp", result.intros.exp || 0);
        if (result.intros.exp) {
          const ttl = result.intros.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await redis.expire(sessionKey, ttl);
        }
      }
    }

    res.json({
      ok: true,
      expires_in: result.expires_in,
      user: result.userProfile,
      session: {
        lastLogins,
        refresh_jti: result.intros?.jti || null,
        refresh_exp: result.intros?.exp || null,
      },
    });
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    res.status(401).json({ error: "Invalid credentials", details: err.response?.data });
  }
});

// === REFRESH TOKEN ===
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const result = await refresh(refreshToken);

    // set cookies
    res.cookie("access_token", result.access_token, { ...cookieOptions, maxAge: result.expires_in * 1000 });
    res.cookie("refresh_token", result.refresh_token, cookieOptions);

    // registra refresh come attività opzionale
    if (result.userProfile?.sub) await recordLogin(result.userProfile.sub);

    // session info
    const lastLogins = result.userProfile?.sub ? await getLastLogins(result.userProfile.sub) : [];

    // salva session mapping refresh_jti
    if (result.intros?.active && result.intros.jti) {
      const sessionKey = `session:${result.userProfile.sub}`;
      if (useRedis) {
        await redis.hset(sessionKey, "refresh_jti", result.intros.jti, "exp", result.intros.exp || 0);
        if (result.intros.exp) {
          const ttl = result.intros.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) await redis.expire(sessionKey, ttl);
        }
      }
    }

    res.json({
      ok: true,
      expires_in: result.expires_in,
      user: result.userProfile,
      session: {
        lastLogins,
        refresh_jti: result.intros?.jti || null,
        refresh_exp: result.intros?.exp || null,
      },
    });
  } catch (err) {
    console.error("❌ Refresh token failed:", err.response?.data || err.message);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// === LOGOUT ===
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  const accessToken = req.cookies.access_token;

  try {
    if (refreshToken) await logout(refreshToken);

    // revoca access token localmente
    if (accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded?.jti && decoded?.exp) {
        const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
        await revokeSetAdd(decoded.jti, ttl);
      }
    }

    // pulizia session Redis
    if (useRedis && accessToken) {
      const decoded = jwt.decode(accessToken);
      if (decoded?.sub) await redis.del(`session:${decoded.sub}`);
    }
  } catch (err) {
    console.warn("⚠️ Logout non completato:", err.message);
  } finally {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ ok: true });
  }
});

module.exports = router;
