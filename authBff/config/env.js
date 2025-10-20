require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3001,
  keycloak: {
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
  redisUrl: process.env.REDIS_URL || null,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://frontend.local.test",
  cookieSecret: process.env.COOKIE_SECRET || "devsecret",
  jwksRefreshInterval: parseInt(process.env.JWKS_REFRESH_INTERVAL_MS || 600000, 10),
  sessionCleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL_MS || 900000, 10),
};

module.exports = config;
