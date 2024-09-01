const express = require('express');
const router = express.Router();

const users = [
  { id: 1, username: 'super', password: '123', roles: ['super-admin'] },
  { id: 2, username: 'bailey', password: '123', roles: ['group-admin'] }
];

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Register route
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Username already exists' });
  }
  const newUser = { id: users.length + 1, username, password, roles: ['user'] };
  users.push(newUser);
  res.json({ success: true, user: newUser });
});

// Middleware to check roles
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    const { role } = req.body; // This would typically be in a token
    if (requiredRoles.some(r => req.body.user.roles.includes(r))) {
      next();
    } else {
      res.status(403).send('Access denied');
    }
  };
};

// Route for promoting a user to Group Admin or Super Admin (Super Admin only)
router.post('/promote', authorize(['super-admin']), (req, res) => {
  const { userId, newRole } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) {
    if (!user.roles.includes(newRole)) {
      user.roles.push(newRole);
      res.json({ success: true, user });
    } else {
      res.status(400).json({ success: false, message: 'User already has this role' });
    }
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Route for a user to delete themselves (any role)
router.delete('/delete', (req, res) => {
  const { userId } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users.splice(userIndex, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

module.exports = router;
