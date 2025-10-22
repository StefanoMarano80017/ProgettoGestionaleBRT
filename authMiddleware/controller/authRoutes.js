const express = require("express");
const jwt = require("jsonwebtoken");
const { login, refresh, logout } = require("../services/keycloakService");
const { recordLogin, getLastLogins } = require("../session/session.js");
const { redis, useRedis } = require("../config/redis.js");
const { revokeSetAdd } = require("../services/revocationService");

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  domain: "local.test",
  path: "/",
  overwrite: true,
};

// --- Helper ---
const setTokens = (res, accessToken, refreshToken, expiresIn) => {
  res.cookie("access_token", accessToken, { ...cookieOptions, maxAge: expiresIn * 1000 });
  res.cookie("refresh_token", refreshToken, cookieOptions);
};

const saveSession = async (userId, intros) => {
  if (!useRedis || !intros?.active || !intros.jti) return;

  const sessionKey = `session:${userId}`;
  await redis.hset(sessionKey, "refresh_jti", intros.jti, "exp", intros.exp || 0);

  if (intros.exp) {
    const ttl = intros.exp - Math.floor(Date.now() / 1000);
    console.log("TTL Redis session:", ttl);
    if (ttl > 0) await redis.expire(sessionKey, ttl);
  }
};

const getSessionInfo = async (userId, intros) => ({
  lastLogins: userId ? await getLastLogins(userId) : [],
  refresh_jti: intros?.jti || null,
  refresh_exp: intros?.exp || null,
});

const handleAuthResponse = async (res, result) => {
  setTokens(res, result.access_token, result.refresh_token, result.expires_in);

  if (result.userProfile?.sub) await recordLogin(result.userProfile.sub);
  await saveSession(result.userProfile?.sub, result.intros);

  res.json({
    ok: true,
    expires_in: result.expires_in,
    user: result.userProfile,
    session: await getSessionInfo(result.userProfile?.sub, result.intros),
  });
};

// --- LOGIN ---
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await login(username, password);
    await handleAuthResponse(res, result);
  } catch (err) {
    console.error("❌ Login failed:", err.response?.data || err.message);
    res.status(401).json({ error: "Invalid credentials", details: err.response?.data });
  }
});

// --- REFRESH ---
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "Missing refresh token" });

  try {
    const result = await refresh(refreshToken);
    console.log("REFRESH RESULT:", result);
    await handleAuthResponse(res, result);
  } catch (err) {
    console.error("❌ Refresh token failed:", err.response?.data || err.message);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// --- LOGOUT ---
const revokeToken = async (token) => {
  if (!token) return;
  const decoded = jwt.decode(token);
  if (decoded?.jti && decoded?.exp) {
    const ttl = Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
    console.log("TTL Redis session:", ttl);
    await revokeSetAdd(decoded.jti, ttl);
  }
  if (useRedis && decoded?.sub) await redis.del(`session:${decoded.sub}`);
};

router.post("/logout", async (req, res) => {
  try {
    await logout(req.cookies.refresh_token).catch(() => {});
    await revokeToken(req.cookies.access_token);
  } catch (err) {
    console.warn("⚠️ Logout non completato:", err.message);
  } finally {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.json({ ok: true });
  }
});

module.exports = router;
