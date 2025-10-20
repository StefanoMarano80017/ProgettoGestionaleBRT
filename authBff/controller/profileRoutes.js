const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

//Per ora non worka
router.get("/me", authMiddleware, (req, res) => {
  const user = req.user;
  const profile = {
    sub: user.sub,
    username: user.preferred_username,
    given_name: user.given_name,
    family_name: user.family_name,
    email: user.email,
    role: user.role || [],
  };
  res.json({ user: profile });
});

router.get("/whoami", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
