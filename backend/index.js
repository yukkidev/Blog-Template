// Express is the web framework that handles HTTP requests
const express = require('express');
// body-parser lets us read data sent in POST/PUT requests
const bodyParser = require('body-parser');
// cookie-parser reads cookies from incoming requests
const cookieParser = require('cookie-parser');
// bcrypt hashes passwords so we never store them in plain text
const bcrypt = require('bcrypt');
// jsonwebtoken creates and verifies login tokens
const jwt = require('jsonwebtoken');
// dotenv loads variables from .env into process.env
require('dotenv').config();

// Our custom middleware that checks for a valid login token
const auth = require('./middleware/auth');
// Router that handles all /posts endpoints
const postsRouter = require('./routes/posts');

// Create the Express app
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// These three lines let Express read data from requests.
// urlencoded handles form data, json handles JSON bodies,
// and cookieParser reads cookie headers.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Hardcoded admin user (replace with a real database)
// Password is hashed with bcrypt - never store plain text passwords!
const users = [
  {
    id: 1,
    username: 'admin',
    // bcrypt.hashSync(password, saltRounds) - 10 salt rounds is standard
    password: bcrypt.hashSync('changeme', 10),
  }
];

// POST /login - authenticate a user and give them a token
app.post('/login', (req, res) => {
  // req.body contains the JSON data sent in the request
  const { username, password } = req.body;
  // Find the user by username
  const user = users.find((u) => u.username === username);

  // If user exists and password matches the hash, create a token
  if (user && bcrypt.compareSync(password, user.password)) {
    // jwt.sign creates a token with user info that expires in 7 days
    const token = jwt.sign(
      { username: user.username, id: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ token, username: user.username });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// GET /auth - check if a token is valid
// The 'auth' middleware runs first - if the token is bad,
// the request never reaches this handler
app.get('/auth', auth, (req, res) => {
  res.json({ message: 'Authorized' });
});

// POST /logout - just returns 200 (client deletes the token)
app.post('/logout', (req, res) => {
  res.sendStatus(200);
});

// Mount the posts router - all routes in postsRouter
// will be prefixed with /posts (e.g. GET /posts, POST /posts)
app.use('/posts', postsRouter);

// Start the server and listen for incoming connections
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
