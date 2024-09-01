const express = require('express');
const router = express.Router();

let groups = []; // Example data structure, replace with database logic

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

// Get all channels within a group
router.get('/:groupId', authorize(['group-admin', 'super-admin', 'user']), (req, res) => {
  const group = JSON.parse(req.headers['group-data']);  // Get group data from headers
  console.log('Request to fetch channels for group ID:', group.id);

  if (group) {
    res.json({ channels: group.channels });
  } else {
    console.error(`Group not found for ID: ${req.params.groupId}`);
    res.status(404).send('Group not found');
  }
});

// Create a channel within a group (Group Admin or Super Admin only)
router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;
  
  // Use the group data sent from the client in the headers
  const groupFromClient = JSON.parse(req.headers['group-data']);
  const group = groupFromClient; // Directly use the group data sent from the client
  // console.log(group, group.adminId, req.user.id);
  if (group && group.adminId === req.user.id) { // Ensure the user is the admin of the group
    const channel = { id: group.channels.length + 1, name };
    group.channels.push(channel);
    console.log('Channel created:', channel); // Log channel creation
    console.log(group);
    res.json({ success: true, channel });
  } else {
    res.status(403).send('Not authorized to create channels in this group');
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



module.exports = router;
