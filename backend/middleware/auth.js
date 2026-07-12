const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware is a function that runs before your route handler.
// It has three params: req (request), res (response), next (call next middleware).
// If we call next(), the request continues to the next handler.
// If we send a response, the request stops here.
const auth = (req, res, next) => {
  // The token is sent in the Authorization header
  let token = req.headers.authorization;

  // No token means not logged in
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  // Some clients send "Bearer <token>", so strip the prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  try {
    // jwt.verify checks the token is valid and not expired.
    // It returns the data we put in when creating it.
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user info to the request so route handlers can use it
    req.user = decoded;
    // Move on to the next middleware or route handler
    next();
  } catch (err) {
    // Token is invalid or expired
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = auth;
