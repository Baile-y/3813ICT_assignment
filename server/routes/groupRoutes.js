const express = require('express');
const fs = require('fs');
const router = express.Router();

const groupsPath = './data/groups.json'; // Path to the JSON file

// Helper function to load groups from JSON file
const loadGroups = () => {
  try {
    const dataBuffer = fs.readFileSync(groupsPath);
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    console.error("File not found or invalid JSON, initializing with empty groups array.");
    return [];
  }
};

// Helper function to save groups to JSON file
const saveGroups = (groups) => {
  const dataJSON = JSON.stringify(groups, null, 2);
  fs.writeFileSync(groupsPath, dataJSON, (err) => {
    if (err) {
      console.error('Error saving groups:', err);
    } else {
      console.log('Groups saved successfully.');
    }
  });
};

// Load groups from JSON file at the start
let groups = loadGroups();

// Middleware to check roles and set user info
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    let userRoles;
    let userId;

    try {
      if (req.headers['user-roles']) {
        userRoles = JSON.parse(req.headers['user-roles']);
        userId = req.headers['user-id'];  // Check if this is correctly coming in as a number/string
      } else if (req.body.user && req.body.user.roles) {
        userRoles = req.body.user.roles;
        userId = req.body.user.id;
      }

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
  const { name, adminId, members } = req.body;

  const group = { id: groups.length + 1, name, adminId, channels: [], members };  // Using array index + 1 as ID
  groups.push(group);

  saveGroups(groups);  // Save updated groups to JSON file
  res.json({ success: true, group });
});

// Delete a group (Group Admin can delete their own groups)
router.delete('/:id', authorize(['group-admin', 'super-admin', 'user']), (req, res) => {
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
      saveGroups(groups);  // Save updated groups to JSON file
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
    saveGroups(groups);  // Save updated groups to JSON file
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
    saveGroups(groups);  // Save updated groups to JSON file
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

  if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
    if (!group.invitations) {
      group.invitations = [];
    }

    const alreadyInvited = group.invitations.some(invite => invite.userId === userId);
    if (alreadyInvited) {
      return res.status(400).send('User is already invited');
    }

    group.invitations.push({ userId });
    saveGroups(groups);  // Save updated groups to JSON file
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

  const inviteIndex = group.invitations.findIndex(invite => invite.userId === userId);

  if (inviteIndex === -1) {
    return res.status(403).send('User was not invited to this group');
  }

  group.members.push({ userId, role: 'user' });
  group.invitations.splice(inviteIndex, 1); // Remove the invitation after acceptance
  saveGroups(groups);  // Save updated groups to JSON file

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
    saveGroups(groups);  // Save updated groups to JSON file
    res.json({ success: true });
  } else {
    res.status(404).send('User not found in group');
  }
});

// Remove a user from a group (Group Admin or Super Admin only)
router.delete('/:groupId/users/:userId', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId, userId } = req.params;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (!group) {
    return res.status(404).send('Group not found');
  }

  const userIndex = group.members.findIndex(member => member.userId === parseInt(userId));
  if (userIndex !== -1) {
    group.members.splice(userIndex, 1);  // Remove the user from the group members
    saveGroups(groups);  // Save updated groups to JSON file
    return res.json({ success: true, message: `User ${userId} removed from group ${groupId}` });
  } else {
    return res.status(404).json({ success: false, message: 'User not found in group' });
  }
});

// Add join request route
router.post('/:groupId/join-request', authorize(['user', 'group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId, name } = req.body;

  const group = groups.find(g => g.id === parseInt(groupId));
  
  if (group) {
    if (!group.joinRequests) {
      group.joinRequests = [];
    }

    const alreadyRequested = group.joinRequests.some(req => req.userId === userId);
    if (!alreadyRequested) {
      group.joinRequests.push({ userId, name });
      saveGroups(groups);  // Save updated groups to JSON file
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'User has already requested to join' });
    }
  } else {
    res.status(404).send('Group not found');
  }
});

// Approve join request
router.post('/:groupId/approve-request', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group) {
    const requestIndex = group.joinRequests?.findIndex(req => req.userId === userId);
    if (requestIndex !== undefined && requestIndex !== -1) {
      group.joinRequests.splice(requestIndex, 1);
      group.members.push({ userId, role: 'user' });
      saveGroups(groups);  // Save updated groups to JSON file
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Join request not found' });
    }
  } else {
    res.status(404).send('Group not found');
  }
});

// Deny join request
router.post('/:groupId/deny-request', authorize(['group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group) {
    group.joinRequests = group.joinRequests?.filter(req => req.userId !== userId);
    saveGroups(groups);  // Save updated groups to JSON file
    res.json({ success: true });
  } else {
    res.status(404).send('Group not found');
  }
});

// Route for a user to leave a group
router.post('/:groupId/leave', authorize(['user', 'group-admin', 'super-admin']), (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const group = groups.find(g => g.id === parseInt(groupId));

  if (group) {
    group.members = group.members.filter(member => member.userId !== userId);

    // Check if the user was the group admin and reassign if necessary
    if (group.adminId === userId && group.members.length > 0) {
      group.adminId = group.members[0].userId;
      group.members[0].role = 'admin';
    }

    saveGroups(groups);  // Save updated groups to JSON file
    res.json({ success: true });
  } else {
    res.status(404).send('Group not found');
  }
});

module.exports = router;
