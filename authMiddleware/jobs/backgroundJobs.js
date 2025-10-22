const config = require("../config/env");
const { refreshJwksCache } = require("../services/jwksService");
const { cleanupInMemory } = require("../services/revocationService");
const logger = require("../utils/logger");

function startBackgroundJobs() {
  setInterval(() => {
    refreshJwksCache().catch((e) => logger.warn("JWKS refresh error:", e.message));
  }, config.jwksRefreshInterval);

  setInterval(() => {
    cleanupInMemory();
  }, config.sessionCleanupInterval);

  logger.info("🧩 Background jobs started");
}

module.exports = { startBackgroundJobs };
