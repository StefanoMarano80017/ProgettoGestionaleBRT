const Redis = require("ioredis");
const config = require("./env");
const logger = require("../utils/logger");

let redis = null;
let useRedis = false;

if (config.redisUrl) {
  try {
    redis = new Redis(config.redisUrl);
    useRedis = true;
    redis.on("error", (e) => {
      logger.warn("⚠️ Redis error:", e.message);
      useRedis = false;
    });
  } catch (err) {
    logger.warn("⚠️ Impossibile connettersi a Redis:", err.message);
    useRedis = false;
  }
}

module.exports = { redis, useRedis };
