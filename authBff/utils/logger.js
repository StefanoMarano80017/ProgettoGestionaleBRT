const pino = require("pino");

const baseLogger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" },
  },
});

baseLogger.http = (...args) => baseLogger.info(...args); 

module.exports = baseLogger;