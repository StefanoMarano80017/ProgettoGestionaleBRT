const Redis = require('ioredis');
const config = require('../config/env');

const redis = new Redis(config.redis.url);

async function setUser(user) {
  await redis.hset('users', user.id, JSON.stringify(user));
}

async function getUser(id) {
  const data = await redis.hget('users', id);
  return data ? JSON.parse(data) : null;
}

async function getUsersByRole(role) {
  const allUsers = await redis.hgetall('users');
  return Object.values(allUsers)
    .map(JSON.parse)
    .filter(u => u.roles.includes(role));
}

async function getUsersByIds(ids) {
  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.hget('users', id));
  const results = await pipeline.exec();
  return results
    .map(([err, res]) => (res ? JSON.parse(res) : null))
    .filter(u => u !== null);
}

// Recupera tutti gli utenti salvati nella cache
async function getAllUsers() {
  const allUsers = await redis.hgetall('users'); // restituisce {id1: 'json', id2: 'json', ...}
  return Object.values(allUsers).map(JSON.parse); // mappa tutti i valori da stringa JSON a oggetto
}

module.exports = { setUser, getUser, getUsersByRole, getUsersByIds, getAllUsers };