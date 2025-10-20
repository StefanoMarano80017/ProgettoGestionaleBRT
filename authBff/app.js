const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const config = require("./config/env");
const logger = require("./utils/logger");
const authRoutes = require("./controller/authRoutes");
const profileRoutes = require("./controller/profileRoutes");
const healthRoutes = require("./controller/healthRoutes");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(config.cookieSecret));
app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: true,
  })
);

// log richieste
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.originalUrl}`);
  next();
});

// rotte principali
app.use("/authBff", authRoutes);
app.use("/authBff", profileRoutes);
app.use("/", healthRoutes);

module.exports = app;
