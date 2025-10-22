const jwt = require("jsonwebtoken");
const { getKey } = require("../services/jwksService");
const { revokeSetHas } = require("../services/revocationService");

async function authMiddleware(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, async (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid or expired token" });

    if (await revokeSetHas(decoded.jti)) {
      return res.status(401).json({ error: "Token revoked" });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
