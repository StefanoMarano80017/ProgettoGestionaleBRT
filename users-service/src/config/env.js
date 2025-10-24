const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || 3002, 10),
  keycloak: {
    url: process.env.KEYCLOAK_URL,
    realm: process.env.KEYCLOAK_REALM,
    adminClientId: process.env.KEYCLOAK_CLIENT_ID,
    adminSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    adminClientUsername: process.env.KEYCLOAK_CLIENT_USERNAME,
    adminClientpassword: process.env.KEYCLOAK_CLIENT_PASSWORD,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  syncInterval: parseInt(process.env.USER_SYNC_INTERVAL_MS || 600000, 10),
};

// Funzione di log sicuro
function logConfig(cfg) {
  const safeConfig = {
    ...cfg,
    keycloak: {
      ...cfg.keycloak,
      adminClientSecret: cfg.keycloak.adminClientSecret ? "***HIDDEN***" : undefined,
    },
  };

  console.log("🟢 App configuration:");
  console.log(JSON.stringify(safeConfig, null, 2));
}

logConfig(config);

module.exports = config;
