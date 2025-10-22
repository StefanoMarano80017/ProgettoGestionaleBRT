const { redis, useRedis } = require("../config/redis");

const inMemoryRevoked = new Map();

async function revokeSetAdd(jti, ttlSeconds) {
  if (!jti) return;
  if (useRedis) {
    await redis.set(`revoked:${jti}`, "1", "EX", ttlSeconds);
  } else {
    inMemoryRevoked.set(jti, Date.now() + ttlSeconds * 1000);
  }
}

async function revokeSetHas(jti) {
  if (!jti) return false;
  if (useRedis) return !!(await redis.get(`revoked:${jti}`));

  const expiry = inMemoryRevoked.get(jti);
  if (!expiry || Date.now() > expiry) {
    inMemoryRevoked.delete(jti);
    return false;
  }
  return true;
}

function cleanupInMemory() {
  const now = Date.now();
  for (const [k, v] of inMemoryRevoked.entries()) if (v < now) inMemoryRevoked.delete(k);
}

module.exports = { revokeSetAdd, revokeSetHas, cleanupInMemory };
