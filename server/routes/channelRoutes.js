const express = require('express');
const router = express.Router();

const { groups } = require('./dataStore'); // Import the shared groups array

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

// Get all channels within a group
router.get('/:groupId', authorize(['group-admin', 'super-admin', 'user']), (req, res) => {
  const groupId = parseInt(req.params.groupId); // Get the group ID from the request params
  const group = groups.find(g => g.id === groupId); // Find the group in the server-side groups array

  console.log('Request to fetch channels for group ID:', groupId);
  console.log('Groups:', JSON.stringify(groups, null, 2));


  if (group) {
    res.json({ channels: group.channels });
  } else {
    console.error(`Group not found for ID: ${groupId}`);
    res.status(404).send('Group not found');
  }
});

// Create a channel within a group (Group Admin or Super Admin only)
router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), (req, res) => {
  const groupId = parseInt(req.params.groupId); // Get the group ID from the request params
  const { name } = req.body;

  // Use the server-side groups array to find the group by ID
  const group = groups.find(g => g.id === groupId);

  console.log('Creating channel in group ID:', groupId);
  console.log('Groups:', groups);

  if (!group) {
    return res.status(404).send('Group not found');
  }

  // Ensure the user is the admin of the group or a super-admin
  if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
    const channel = { id: group.channels.length + 1, name };
    group.channels.push(channel);
    console.log('Channel created:', channel); // Log channel creation
    res.json({ success: true, channel });
  } else {
    res.status(403).send('Not authorized to create channels in this group');
  }
});

// Delete a channel within a group (Group Admin or Super Admin only)
router.delete('/:groupId/channels/:channelId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const groupId = parseInt(req.params.groupId); // Get the group ID from the request params
  const channelId = parseInt(req.params.channelId); // Get the channel ID from the request params

  // Find the group in the server-side groups array
  const group = groups.find(g => g.id === groupId);

  console.log(`Request to delete channel ID ${channelId} from group ID ${groupId}`);
  console.log('Groups:', groups);

  if (group) {
    group.channels = group.channels.filter(c => c.id !== channelId);
    res.json({ success: true });
  } else {
    console.error(`Group not found for ID: ${groupId}`);
    res.status(404).send('Group not found');
  }
});

module.exports = router;
