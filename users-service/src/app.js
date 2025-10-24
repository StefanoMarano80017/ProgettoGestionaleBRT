const express = require('express');
const config = require('./config/env');
const usersRouter = require('./routes/users');
const userService = require('./services/userService');

const { initEventConsumer } = require('./events/eventHandler');

const app = express();
app.use(express.json());


app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});


// Endpoint utenti
app.use('/users', usersRouter);

// Placeholder consumer eventi (per futuro bus eventi)
initEventConsumer();

// Sync iniziale utenti Keycloak
(async () => {
  try {
    await userService.syncAllUsers();
    console.log('Initial Keycloak sync completed');
  } catch (err) {
    console.error('Error syncing Keycloak users:', err);
  }
})();

// Sync periodico
setInterval(async () => {
  try {
    await userService.syncAllUsers();
    console.log('Periodic Keycloak sync completed');
  } catch (err) {
    console.error('Error in periodic Keycloak sync:', err);
  }
}, config.syncInterval);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Users-service listening on port ${PORT}`);
});
