const express = require('express');
// express.Router() creates a mini app for handling related routes.
// This keeps route code separate from the main server file.
const router = express.Router();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const auth = require('../middleware/auth');

// Build the path to our data file
const DATA_FILE = path.join(__dirname, '..', 'data', 'posts.json');

// Create the data file if it doesn't exist yet
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Read the posts.json file and return the array of posts
function readPosts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Write the posts array back to posts.json
function writePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// Create a unique ID from the post title.
// "Hello World" becomes "Hello_World_01", and if another
// post with the same title exists, it becomes "Hello_World_02".
function generateId(title, posts) {
  // Replace non-alphanumeric characters with underscores
  const slug = title.replace(/[^a-zA-Z0-9]/g, '_');
  // Find any existing posts with the same title and get their numbers
  const existing = posts
    .filter((p) => p.title === title)
    .map((p) => parseInt(p.id.slice(-2)))
    .filter((n) => !isNaN(n));
  // Use the next number, or 1 if none exist yet
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${slug}_${next.toString().padStart(2, '0')}`;
}

// GET /posts - returns visible posts by default.
// With ?all=true and a valid auth token, returns all posts (for admin panel).
router.get('/', (req, res) => {
  const posts = readPosts();

  // If ?all=true is requested, verify auth before returning all posts
  if (req.query.all === 'true') {
    let token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    try {
      jwt.verify(token, JWT_SECRET);
      return res.json(posts);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Public: only return posts where display is not false
  const visiblePosts = posts.filter((p) => p.display !== false);
  res.json(visiblePosts);
});

// POST /posts - create a new post (requires login)
// 'auth' middleware runs first - if the token is bad,
// the request stops here and never reaches this handler
router.post('/', auth, (req, res) => {
  // req.body has the JSON data sent in the request
  const { title, content, display } = req.body;
  const posts = readPosts();

  const newPost = {
    id: generateId(title, posts),
    title,
    body: content,
    // Format the date nicely like "July 12, 2026"
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    // If display isn't provided, default to true (visible)
    display: display !== undefined ? display : true,
  };

  posts.push(newPost);
  writePosts(posts);
  // 201 means "Created" - the standard status code for new resources
  res.status(201).json(newPost);
});

// PUT /posts/:postId - update an existing post (requires login)
// :postId is a URL parameter - Express puts it in req.params
router.put('/:postId', auth, (req, res) => {
  const { postId } = req.params;
  const { title, content, featured, display } = req.body;
  const posts = readPosts();
  // Find the index of the post with this ID
  const index = posts.findIndex((p) => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts[index].title = title;
  posts[index].body = content;

  // Only update these fields if they were actually sent
  // (so you can update just the title without touching featured)
  if (featured !== undefined) {
    posts[index].featured = featured;
  }
  if (display !== undefined) {
    posts[index].display = display;
  }

  writePosts(posts);
  res.json(posts[index]);
});

// DELETE /posts/:postId - delete a post (requires login)
router.delete('/:postId', auth, (req, res) => {
  const { postId } = req.params;
  const posts = readPosts();
  const index = posts.findIndex((p) => p.id === postId);

  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  // splice removes the post from the array and returns it
  const deleted = posts.splice(index, 1)[0];
  writePosts(posts);
  res.json(deleted);
});

module.exports = router;
