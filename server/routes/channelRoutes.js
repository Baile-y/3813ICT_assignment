const express = require('express');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for storing images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/message-images'); // Store in 'uploads/message-images' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as filename to avoid conflicts
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
});

// Middleware to check roles and set user info
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    let userRoles;
    let userId;

    try {
      if (req.headers['user-roles']) {
        userRoles = JSON.parse(req.headers['user-roles']);
        userId = req.headers['user-id'];
      } else if (req.body.user && req.body.user.roles) {
        userRoles = req.body.user.roles;
        userId = req.body.user.id;
      }
      
      if (Array.isArray(userRoles) && requiredRoles.some(role => userRoles.includes(role))) {
        req.user = { id: userId, roles: userRoles };
        next();
      } else {
        res.status(403).send('Not authorized');
      }
    } catch (error) {
      res.status(400).send('Invalid user data in headers or request body');
    }
  };
};


// Passing `db` as a parameter to the module
module.exports = (db) => {

  // Get all channels within a group
  router.get('/:groupId', authorize(['group-admin', 'super-admin', 'user']), async (req, res) => {

    const groupId = req.params.groupId;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId.createFromHexString(groupId) });

      if (group) {
        res.json({ channels: group.channels });
      } else {
        res.status(404).send('Group not found');
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ error: 'Error fetching channels' });
    }
  });

  // Create a channel within a group (Group Admin or Super Admin only)
  router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const groupId = req.params.groupId;
    const { name } = req.body;

    try {
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
        const channel = { _id: new ObjectId(), name }; // Use _id for the channel
        await db.collection('groups').updateOne(
          { _id: new ObjectId(groupId) },
          { $push: { channels: channel } }
        );
        res.json({ success: true, channel });
      } else {
        res.status(403).send('Not authorized to create channels in this group');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error creating channel' });
    }
  });

  // Delete a channel within a group (Group Admin or Super Admin only)
  router.delete('/:groupId/channels/:channelId', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const groupId = req.params.groupId; // Get the group ID from the request params
    const channelId = req.params.channelId; // Get the channel ID from the request params

    try {
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      // Ensure the user is the admin of the group or a super-admin
      if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
        await db.collection('groups').updateOne(
          { _id: new ObjectId(groupId) },
          { $pull: { channels: { _id: new ObjectId(channelId) } } }
        );

        res.json({ success: true });
      } else {
        res.status(403).send('Not authorized to delete channels in this group');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting channel' });
    }
  });

  router.post('/message', upload.single('image'), async (req, res) => {
    const { channelId, userId, sender, content } = req.body;
  
    // Validate channelId and userId
    if (!ObjectId.isValid(channelId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid channelId or userId' });
    }
  
    try {
      // Fetch the user to get the avatar
      const db = req.app.locals.db;
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Prepare the message object
      const message = {
        channelId: new ObjectId(channelId),
        userId: new ObjectId(userId),
        sender: user.username,
        content,
        avatar: user.avatar ? `http://localhost:3000/${user.avatar}` : 'http://localhost:3000/uploads/default-avatar.png', // Ensure the full path is included
        timestamp: new Date(),
      };
  
      // If an image is provided, include the image path in the message
      if (req.file) {
        message.image = req.file.path; // Save the image file path
      }
  
      // Store the message in the database
      await db.collection('messages').insertOne(message);
  
      res.status(201).json({ success: true, message });
    } catch (error) {
      console.error('Error uploading message:', error);
      res.status(500).json({ error: 'Error uploading message' });
    }
  });
  
  // GET: Retrieve all messages from a specific channel
  router.get('/channels/:channelId/messages', authorize(['user', 'group-admin', 'super-admin']), async (req, res) => {
    const { channelId } = req.params;

    try {
      // Validate the channelId
      if (!ObjectId.isValid(channelId)) {
        return res.status(400).send('Invalid channelId');
      }

      // Fetch messages associated with the channelId from the messages collection
      const messages = await db.collection('messages').find({ channelId: ObjectId.createFromHexString(channelId) }).toArray();

      res.json(messages);
    } catch (error) {
      console.error('Error retrieving messages:', error);
      res.status(500).send('Error retrieving messages');
    }
  });

  module.exports = router;
  return router;
};
