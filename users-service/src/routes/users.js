const express = require('express');
const router = express.Router();
const userService = require('../services/userService');


/**
 * GET /api/users/all
 * Restituisce tutti gli utenti presenti nella cache
 */
router.get('/all', async (req, res) => {
  try {
    console.log('[UsersController] Fetching all users from cache');
    const allUsers = await userService.getAllUsers(); // da implementare se non esiste
    console.log(`[UsersController] Returning ${allUsers.length} users`);
    res.json(allUsers);
  } catch (err) {
    console.error('[UsersController] Error fetching all users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



/**
 * POST /api/users/query
 * Body JSON:
 * {
 *   "role": "manager",          // opzionale
 *   "ids": ["id1", "id2"]       // opzionale
 * }
 * Almeno uno dei due campi deve essere presente.
 */
router.post('/query', async (req, res) => {
  const { role, ids } = req.body;
  console.log('[UsersController] Received query request:', { role, ids });

  if (!role && (!ids || ids.length === 0)) {
    console.warn('[UsersController] Missing role or ids in request body');
    return res.status(400).json({ error: 'role or ids field required in body' });
  }

  try {
    let users = [];

    if (role) {
      console.log(`[UsersController] Fetching users by role: ${role}`);
      const roleUsers = await userService.getUsersByRole(role);
      console.log(`[UsersController] Found ${roleUsers.length} users for role "${role}"`);
      users = users.concat(roleUsers);
    }

    if (ids && ids.length > 0) {
      console.log(`[UsersController] Fetching users by IDs: ${ids.join(', ')}`);
      const idUsers = await userService.getUsersByIds(ids);
      console.log(`[UsersController] Found ${idUsers.length} users for provided IDs`);
      users = users.concat(idUsers);
    }

    // Rimuoviamo eventuali duplicati se un utente è presente sia per role che per ids
    const uniqueUsers = Array.from(new Map(users.map(u => [u.id, u])).values());
    console.log(`[UsersController] Returning ${uniqueUsers.length} unique users`);

    res.json(uniqueUsers);
  } catch (err) {
    console.error('[UsersController] Error querying users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
