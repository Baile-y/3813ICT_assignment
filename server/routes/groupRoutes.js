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

// Get all groups (with role-based access)
router.get('/', authorize(['super-admin', 'group-admin', 'user']), (req, res) => {
  const user = req.user;

  if (user.roles.includes('super-admin')) {
    // Super Admin can access all groups
    res.json({ groups });
  } else {
    // Group Admins and Users see only the groups they belong to
    const userGroups = groups.filter(group =>
      group.members.some(member => member.userId === user.id)
    );
    res.json({ groups: userGroups });
  }
});

// Create a group (Group Admin or Super Admin only)
router.post('/create', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { name, adminId, members } = req.body;

  const group = { id: groups.length + 1, name, adminId, channels: [], members };  // Using array index + 1 as ID
  groups.push(group);

  console.log('Group created:', group);
  res.json({ success: true, group });
});

// Delete a group (Group Admin can delete their own groups)
router.delete('/:id', authorize(['group-admin', 'super-admin']), (req, res) => {
  const groupId = parseInt(req.params.id);
  const group = groups.find(g => g.id === groupId);

  if (!group) {
    return res.status(404).send('Group not found');
  }

  // Check if the user is the original group admin, a promoted admin, or a super admin
  const isSuperAdmin = req.user.roles.includes('super-admin');
  const isOriginalAdmin = group.adminId === parseInt(req.user.id);
  const isPromotedAdmin = group.members.some(member => 
    member.userId === parseInt(req.user.id) && member.role === 'group-admin'
  );
  
  if (isSuperAdmin || isOriginalAdmin || isPromotedAdmin) {
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex !== -1) {
      groups.splice(groupIndex, 1);
      return res.json({ success: true });
    }
  } else {
    return res.status(403).send('Not authorized to delete this group');
  }
});



// Create a channel within a group (Super Admin or Group Admin only)
router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group && (group.adminId === req.user.id || req.user.roles.includes('super-admin'))) {
    const channel = { id: group.channels.length + 1, name };
    group.channels.push(channel);
    res.json({ success: true, channel });
  } else {
    console.log(`Group not found or user not authorized for ID: ${groupId}`);
    res.status(404).send('Group not found or not authorized');
  }
});

// Delete a channel within a group (Super Admin or Group Admin only)
router.delete('/:groupId/channels/:channelId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId, channelId } = req.params;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group && (group.adminId === req.user.id || req.user.roles.includes('super-admin'))) {
    group.channels = group.channels.filter(c => c.id !== parseInt(channelId));
    res.json({ success: true });
  } else {
    console.error(`Group not found or user not authorized for ID: ${groupId}`);
    res.status(404).send('Group not found or not authorized');
  }
});

// Invite a user to a group (Group Admin or Super Admin only)
router.post('/:groupId/invite', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = groups.find(g => g.id === parseInt(groupId));

  if (!group) {
    return res.status(404).send('Group not found');
  }

  // Check if the user sending the invite is the admin of the group or a super admin
  if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
    if (!group.invitations) {
      group.invitations = [];
    }

    // Check if the user is already invited
    const alreadyInvited = group.invitations.some(invite => invite.userId === userId);
    if (alreadyInvited) {
      return res.status(400).send('User is already invited');
    }

    group.invitations.push({ userId });
    res.json({ success: true, message: 'User invited successfully' });
  } else {
    res.status(403).send('Not authorized to invite users to this group');
  }
});

// Add a member to a group (when the user accepts the invite)
router.post('/:groupId/members', authorize(['user', 'group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = groups.find(g => g.id === parseInt(groupId));

  if (!group) {
    return res.status(404).send('Group not found');
  }

  // Check if the user was invited
  const inviteIndex = group.invitations.findIndex(invite => invite.userId === userId);

  if (inviteIndex === -1) {
    return res.status(403).send('User was not invited to this group');
  }

  // Add the user as a member
  group.members.push({ userId, role: 'user' });
  group.invitations.splice(inviteIndex, 1); // Remove the invitation after acceptance

  res.json({ success: true, group });
});

// Promote a user to group admin (accessible by super-admin or current group admin)
router.post('/:groupId/promote', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId, role } = req.body;

  const group = groups.find(g => g.id === parseInt(groupId));
  if (!group) {
    return res.status(404).send('Group not found');
  }

  const member = group.members.find(m => m.userId === parseInt(userId));
  if (member) {
    member.role = role;  // Update the role
    res.json({ success: true });
  } else {
    res.status(404).send('User not found in group');
  }
});



module.exports = router;
