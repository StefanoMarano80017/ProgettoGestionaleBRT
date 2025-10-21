const axios = require("axios");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const { revokeSetAdd } = require("./revocationService");

const KEYCLOAK_TOKEN_URL = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token`;
const KEYCLOAK_INTROSPECT_URL = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/token/introspect`;
const KEYCLOAK_LOGOUT_URL = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/logout`;

async function introspectToken(token) {
  try {
    const res = await axios.post(
      KEYCLOAK_INTROSPECT_URL,
      new URLSearchParams({
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.clientSecret,
        token,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return res.data;
  } catch {
    return null;
  }
}

async function login(username, password) {
  const res = await axios.post(
    KEYCLOAK_TOKEN_URL,
    new URLSearchParams({
      client_id: config.keycloak.clientId,
      client_secret: config.keycloak.clientSecret,
      grant_type: "password",
      username,
      password,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, refresh_token, expires_in } = res.data;
  const decoded = jwt.decode(access_token);
  const intros = await introspectToken(refresh_token);

  const userProfile = {
    sub: decoded.sub,
    username: decoded.preferred_username,
    given_name: decoded.given_name,
    family_name: decoded.family_name,
    email: decoded.email,
    role: decoded.roles || [],
  };

  return { access_token, refresh_token, expires_in, intros, userProfile };
}

async function refresh(refreshToken) {
  const res = await axios.post(
    KEYCLOAK_TOKEN_URL,
    new URLSearchParams({
      client_id: config.keycloak.clientId,
      client_secret: config.keycloak.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const { access_token, refresh_token: newRefreshToken, expires_in } = res.data;
  const decoded = jwt.decode(access_token);

  const intros = await introspectToken(newRefreshToken);
  // revoca solo se Keycloak ha effettivamente ruotato il refresh token
  if (newRefreshToken !== refreshToken) {
    const oldIntros = await introspectToken(refreshToken);
    if (oldIntros?.active && oldIntros.jti && oldIntros.exp) {
      const ttl = Math.max(1, oldIntros.exp - Math.floor(Date.now() / 1000));
      await revokeSetAdd(oldIntros.jti, ttl);
    }
  }

  const userProfile = {
    sub: decoded.sub,
    username: decoded.preferred_username,
    given_name: decoded.given_name,
    family_name: decoded.family_name,
    email: decoded.email,
    role: decoded.roles || [],
  };

  return { access_token, refresh_token: newRefreshToken, expires_in, intros, userProfile };
}

async function logout(refreshToken) {
  if (!refreshToken) return;

  try {
    await axios.post(
      KEYCLOAK_LOGOUT_URL,
      new URLSearchParams({
        client_id: config.keycloak.clientId,
        client_secret: config.keycloak.clientSecret,
        refresh_token: refreshToken,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 5000 }
    );
    console.log("✅ Logout completato lato Keycloak");
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.error_description || err.message;
    // Se il token è già scaduto, consideralo come logout ok
    if (status === 400 && message.includes("invalid_token")) {
      console.warn("⚠️ Logout ignorato: refresh token già scaduto o revocato");
    } else {
      console.error(`⚠️ Logout Keycloak fallito (status: ${status || "N/A"}): ${message}`);
    }
  }
}


module.exports = { login, refresh, logout, introspectToken };
