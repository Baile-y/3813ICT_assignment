const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

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

// Passing `db` as a parameter to the module
module.exports = (db) => {

  // Login route
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await db.collection('users').findOne({ username, password });
      if (user) {
        res.json({ success: true, user });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error logging in' });
    }
  });

  // Register route
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
      // Check if the username already exists
      const existingUser = await db.collection('users').findOne({ username });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
      }

      // Insert new user into the collection
      const newUser = {
        username,
        password, // Store securely (e.g., hashed)
        roles: ['user'],
        avatar: '', // Add avatar field (initially empty)
        createdAt: new Date(),
      };
      const result = await db.collection('users').insertOne(newUser);

      // Send back the result properly
      res.json({ success: true, user: { _id: result.insertedId, ...newUser } });
    } catch (error) {
      console.error('Error registering user:', error.message || error);
      res.status(500).json({ error: 'Error registering user' });
    }
  });

  // Route for promoting a user to Group Admin or Super Admin (Super Admin only)
  router.post('/promote', authorize(['super-admin']), async (req, res) => {
    const { userId, newRole } = req.body;
    try {
      const user = await db.collection('users').findOne({ _id: ObjectId(userId) });
      if (user) {
        if (!user.roles.includes(newRole)) {
          await db.collection('users').updateOne(
            { _id: ObjectId(userId) },
            { $addToSet: { roles: newRole } }
          );
          res.json({ success: true, message: 'User promoted' });
        } else {
          res.status(400).json({ success: false, message: 'User already has this role' });
        }
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error promoting user' });
    }
  });

  // Route for a user to delete themselves (any role)
  router.delete('/delete/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
      // Check if the user exists
      const user = await db.collection('users').findOne({ _id: ObjectId(userId) });

      if (user) {
        // If deleting self, proceed
        if (req.headers['user-id'] === String(userId)) {
          await db.collection('users').deleteOne({ _id: ObjectId(userId) });
          return res.json({ success: true, message: 'User deleted' });
        }

        // If deleting another user, check if the requestor is a Super Admin
        const userRoles = req.headers['user-roles'] ? JSON.parse(req.headers['user-roles']) : [];
        if (userRoles.includes('super-admin')) {
          await db.collection('users').deleteOne({ _id: ObjectId(userId) });
          return res.json({ success: true, message: 'User deleted' });
        } else {
          return res.status(403).json({ success: false, message: 'Not authorized to delete this user' });
        }
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting user' });
    }
  });

  // Route to get all users (Super Admin only)
  router.get('/all', authorize(['super-admin']), async (req, res) => {
    try {
      const users = await db.collection('users').find().toArray();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching users' });
    }
  });

  // Route for promoting a user to Super Admin (Super Admin only)
  router.post('/promote-to-superadmin', authorize(['super-admin']), async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await db.collection('users').findOne({ _id: ObjectId(userId) });

      if (user) {
        if (!user.roles.includes('super-admin')) {
          await db.collection('users').updateOne(
            { _id: ObjectId(userId) },
            { $addToSet: { roles: 'super-admin' } }
          );
          res.json({ success: true, message: 'User promoted to Super Admin' });
        } else {
          res.status(400).json({ success: false, message: 'User is already a Super Admin' });
        }
      } else {
        res.status(404).json({ success: false, message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error promoting user' });
    }
  });

  return router;
};
