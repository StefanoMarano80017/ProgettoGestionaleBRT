const { redis, useRedis } = require("../config/redis"); // il tuo modulo
const logger = require("../utils/logger");

const MAX_LOGINS = 3; // quante ultime login salvare

async function recordLogin(userId) {
  if (!useRedis) return;

  const key = `user:${userId}:logins`;
  const timestamp = new Date().toISOString();

  try {
    await redis.lpush(key, timestamp);   // aggiunge in testa
    await redis.ltrim(key, 0, MAX_LOGINS - 1); // mantiene solo gli ultimi 3
  } catch (err) {
    logger.warn("⚠️ Impossibile salvare login in Redis:", err.message);
  }
}

async function getLastLogins(userId) {
  if (!useRedis) return [];

  const key = `user:${userId}:logins`;
  try {
    const logins = await redis.lrange(key, 0, MAX_LOGINS - 1);
    return logins;
  } catch (err) {
    logger.warn("⚠️ Impossibile leggere login da Redis:", err.message);
    return [];
  }
}

module.exports = { recordLogin, getLastLogins };