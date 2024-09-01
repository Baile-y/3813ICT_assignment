const express = require('express');
const router = express.Router();

const groups = []; // Example data structure, replace with database logic

// Middleware to check roles and set user info
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    let userRoles;
    let userId;

    try {
      console.log('Authorization Headers:', req.headers);

      if (req.headers['user-roles']) {
        userRoles = JSON.parse(req.headers['user-roles']);
        userId = req.headers['user-id'];
      } else if (req.body.user && req.body.user.roles) {
        userRoles = req.body.user.roles;
        userId = req.body.user.id;
      }

      console.log('Parsed Roles:', userRoles);
      console.log('Parsed User ID:', userId);

      if (Array.isArray(userRoles) && requiredRoles.some(role => userRoles.includes(role))) {
        req.user = { id: userId, roles: userRoles };
        next();
      } else {
        console.log('Authorization failed');
        res.status(403).send('Not authorized');
      }
    } catch (error) {
      console.log('Error in authorization middleware:', error);
      res.status(400).send('Invalid user data in headers or request body');
    }
  };
};

// Get all groups (with role-based access)
router.get('/', authorize(['group-admin', 'super-admin', 'user']), (req, res) => {
  res.json({ groups });
});

// Create a group (Group Admin or Super Admin only)
router.post('/create', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { name } = req.body;
  const adminId = req.user.id; // Use the user id from the authorized user
  
  const group = { id: groups.length + 1, name, adminId, channels: [] };
  groups.push(group);
  
  console.log('Group created:', group);
  res.json({ success: true, group });
});

// Delete a group (Group Admin can delete their own groups)
router.delete('/:id', authorize(['group-admin', 'super-admin']), (req, res) => {
  const groupId = parseInt(req.params.id);
  const groupIndex = groups.findIndex(g => g.id === groupId && g.adminId === req.user.id);

  if (groupIndex !== -1) {
    groups.splice(groupIndex, 1);
    res.json({ success: true });
  } else {
    res.status(403).send('Not authorized to delete this group');
  }
});

// Create a channel within a group (Group Admin or Super Admin only)
router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  // Assume groups is available and updated correctly
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group) {
    const channel = { id: group.channels.length + 1, name };
    group.channels.push(channel);
    res.json({ success: true, channel });
  } else {
    console.log(`Group not found for ID: ${groupId}`);
    res.status(404).send('Group not found');
  }
});

// Delete a channel within a group (Group Admin or Super Admin only)
router.delete('/:groupId/channels/:channelId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const group = JSON.parse(req.headers['group-data']);  // Get group data from headers
  const { channelId } = req.params;

  console.log(`Request to delete channel ID ${channelId} from group ID ${group.id}`);

  if (group) {
    group.channels = group.channels.filter(c => c.id !== parseInt(channelId));
    res.json({ success: true });
  } else {
    console.error(`Group not found for ID: ${req.params.groupId}`);
    res.status(404).send('Group not found');
  }
});


// Remove a user from a group (Group Admin or Super Admin only)
router.delete('/:groupId/users/:userId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId, userId } = req.params;
  const group = groups.find(g => g.id === parseInt(groupId) && g.adminId === req.user.id);

  if (group) {
    group.users = group.users.filter(u => u.id !== parseInt(userId));
    res.json({ success: true });
  } else {
    res.status(403).send('Not authorized to remove users from this group');
  }
});

// Ban a user from a channel and report to Super Admins
router.post('/:groupId/channels/:channelId/ban/:userId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId, channelId, userId } = req.params;
  const group = groups.find(g => g.id === parseInt(groupId) && g.adminId === req.user.id);

  if (group) {
    // Logic to ban user from the channel
    // Logic to report to Super Admins (e.g., send email or log a report)
    res.json({ success: true, message: 'User banned and reported to Super Admins' });
  } else {
    res.status(403).send('Not authorized to ban users from this channel');
  }
});

module.exports = router;
