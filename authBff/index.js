const app = require("./app");
const config = require("./config/env");
const { startBackgroundJobs } = require("./jobs/backgroundJobs");
const { refreshJwksCache } = require("./services/jwksService");
const logger = require("./utils/logger");

app.listen(config.port, () => {
  logger.info(`🚀 BFF running on port ${config.port}`);
  refreshJwksCache().catch(() => {});
  startBackgroundJobs();
});
