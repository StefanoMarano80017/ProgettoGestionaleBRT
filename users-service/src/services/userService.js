const axios = require('axios');
const config = require('../config/env');
const userCache = require('./userCache');

const KEYCLOAK_URL = config.keycloak.url;
const REALM = config.keycloak.realm;

const CLIENT_ID = config.keycloak.adminClientId;
const CLIENT_SECRET = config.keycloak.adminSecret;

const CLIENT_USERNAME = config.keycloak.adminClientUsername;
const CLIENT_PASSWORD = config.keycloak.adminClientpassword;


// Recupera l'utente del service account
async function getServiceAccountUser(token) {
  try {
    console.log('[UserService] Fetching service account user for client:', CLIENT_ID);
    const clients = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const clientId = clients.data[0].id;

    const serviceAccount = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientId}/service-account-user`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('[UserService] Service account user retrieved:', serviceAccount.data.id);
    return serviceAccount.data;
  } catch (err) {
    console.error('[UserService] Error fetching service account user:', err.response?.data || err.message);
    throw err;
  }
}

// Assegna ruoli necessari al service account
async function assignRolesToServiceAccount(token, serviceUserId) {
  try {
    console.log('[UserService] Assigning roles to service account:', serviceUserId);

    // Ottieni client ID del realm-management
    const realmMgmt = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=realm-management`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const realmMgmtId = realmMgmt.data[0].id;

    // Ottieni i ruoli dal client realm-management
    const roles = await axios.get(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${realmMgmtId}/roles`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const neededRoles = roles.data.filter(r => ['view-users', 'query-users'].includes(r.name));
    console.log('[UserService] Roles to assign:', neededRoles.map(r => r.name));

    // Assegna i ruoli al service account
    await axios.post(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${serviceUserId}/role-mappings/clients/${realmMgmtId}`,
      neededRoles,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('[UserService] Roles assigned successfully');
  } catch (err) {
    console.error('[UserService] Error assigning roles to service account:', err.response?.data || err.message);
    throw err;
  }
}

// Query utenti dalla cache per ruolo
async function getUsersByRole(role) {
  console.log(`[UserService] Querying users by role: ${role}`);
  const users = await userCache.getUsersByRole(role);
  console.log(`[UserService] Found ${users.length} users with role: ${role}`);
  return users;
}

// Query utenti dalla cache per lista di ID
async function getUsersByIds(ids) {
  console.log('[UserService] Querying users by IDs:', ids);
  const users = await userCache.getUsersByIds(ids);
  console.log(`[UserService] Found ${users.length} users for provided IDs`);
  return users;
}

// Aggiorna un singolo utente nella cache
async function updateUser(user) {
  console.log(`[UserService] Updating user in cache: ${user.id}`);
  await userCache.setUser(user);
  console.log(`[UserService] User ${user.id} updated successfully`);
}

// Ottiene un token admin tramite service account (client credentials)
async function getAdminToken() {
  const url = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  // ho usato uno user con il ruolo che gli permette di accedere alla chiamata, ma si può creare un service account in keycloak
  params.append('grant_type', 'password');
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('username', CLIENT_USERNAME);
  params.append('password', CLIENT_PASSWORD);
  try {
    const res = await axios.post(url, params);
    console.log('[UserService] Access token retrieved successfully');
    return res.data.access_token;
  } catch (err) {
    console.error('[UserService] Error obtaining admin token:', err.response?.data || err.message);
    throw err;
  }
}

// Recupera tutti gli utenti Keycloak
async function fetchAllUsers(token) {
  const res = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Recupera i ruoli di un singolo utente (realm roles)
async function getUserRoles(token, userId) {
  try {
    const url = `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${userId}/role-mappings/realm`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    return res.data.map(r => r.name);
  } catch (err) {
    console.error(`[UserService] Error fetching roles for user ${userId}:`, err.response?.data || err.message);
    return [];
  }
}

// Sincronizza tutti gli utenti Keycloak nella cache Redis
async function syncAllUsers() {
  try {
    console.log('[UserService] Starting sync of Keycloak users');
    const token = await getAdminToken();
    console.log('[UserService] AdminToken acquired successfully');

    const users = await fetchAllUsers(token);
    console.log(`[UserService] Retrieved ${users.length} users from Keycloak`);

    // Parallelizza il recupero dei ruoli e costruisce dati "puliti"
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await getUserRoles(token, user.id);

        // Mappatura "pulita"
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,                   // array di nomi dei ruoli
          attributes: user.attributes || {} // opzionale, se vuoi salvare altri campi custom
        };
      })
    );

    // Salva in cache
    await Promise.all(usersWithRoles.map(userCache.setUser));
    console.log('[UserService] Synchronization completed successfully');
  } catch (err) {
    console.error('[UserService] Error syncing Keycloak users:', err.response?.data || err.message);
  }
}

// Recupera tutti gli utenti dalla cache
async function getAllUsers() {
  console.log('[UserService] Retrieving all users from cache');
  return userCache.getAllUsers(); // implementa questa funzione in userCache
}

module.exports = { 
  syncAllUsers, 
  getUsersByRole, 
  getUsersByIds, 
  updateUser, 
  getAllUsers 
};