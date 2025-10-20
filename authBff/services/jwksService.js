const axios = require("axios");
const jwksClient = require("jwks-rsa");
const config = require("../config/env");
const logger = require("../utils/logger");

const JWKS_URI = `${config.keycloak.url}/realms/${config.keycloak.realm}/protocol/openid-connect/certs`;

const jwks = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function refreshJwksCache() {
  try {
    logger.info("♻️  Aggiornamento JWKS cache...");
    await axios.get(JWKS_URI, { timeout: 5000 });
    logger.info("✅ JWKS fetched");
  } catch (err) {
    logger.warn("⚠️ Errore fetching JWKS:", err.message);
  }
}

module.exports = { getKey, refreshJwksCache };
