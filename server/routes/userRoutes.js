const express = require('express');
const router = express.Router();

const users = [
  { id: 1, username: 'super', password: '123', roles: ['super-admin'] },
  { id: 2, username: 'bailey', password: '123', roles: ['group-admin'] }
];

// Middleware to check roles using headers
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    const userRoles = req.headers['user-roles'] ? JSON.parse(req.headers['user-roles']) : [];
    if (requiredRoles.some(r => userRoles.includes(r))) {
      next();
    } else {
      res.status(403).send('Access denied');
    }
  };
};

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

  // Check if the username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ success: false, message: 'Username already exists' });
  }

  // If the username is unique, create the new user
  const newUser = { id: users.length + 1, username, password, roles: ['user'] };
  users.push(newUser);
  res.json({ success: true, user: newUser });
});

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
router.delete('/delete/:userId', (req, res) => {
  const { userId } = req.params;
  const userIndex = users.findIndex(u => u.id === parseInt(userId));

  if (userIndex !== -1) {
    // If deleting self, just proceed
    if (req.headers['user-id'] === String(userId)) {
      users.splice(userIndex, 1);
      return res.json({ success: true });
    }

    // If deleting another user, check if the requestor is a Super Admin
    const userRoles = req.headers['user-roles'] ? JSON.parse(req.headers['user-roles']) : [];
    if (userRoles.includes('super-admin')) {
      users.splice(userIndex, 1);
      return res.json({ success: true });
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
    }
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

router.get('/all', authorize(['super-admin']), (req, res) => {
  res.json(users);
});

// Route for promoting a user to Super Admin (Super Admin only)
router.post('/promote-to-superadmin', authorize(['super-admin']), (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);

  if (user) {
    if (!user.roles.includes('super-admin')) {
      user.roles.push('super-admin');
      res.json({ success: true, user });
    } else {
      res.status(400).json({ success: false, message: 'User is already a super admin' });
    }
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});


module.exports = router;
