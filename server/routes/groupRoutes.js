const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

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
        console.log('Authorization failed');
        res.status(403).send('Not authorized');
      }
    } catch (error) {
      console.log('Error in authorization middleware:', error);
      res.status(400).send('Invalid user data in headers or request body');
    }
  };
};

// Passing `db` as a parameter to the module
module.exports = (db) => {

  /// Get all groups (with role-based access)
  router.get('/', authorize(['group-admin', 'super-admin', 'user']), async (req, res) => {
    try {
      const groups = await db.collection('groups').find().toArray();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching groups' });
    }
  });

  // Create a group (Group Admin or Super Admin only)
  router.post('/create', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { name, adminId, members } = req.body;

    // Validate input
    if (!name || !adminId || !members) {
      return res.status(400).json({ success: false, message: 'Invalid input: name, adminId, and members are required.' });
    }

    try {
      const group = {
        name,
        adminId,
        channels: [], // Initialize with empty channels
        members,
        createdAt: new Date(),
        joinRequests: [],
      };

      const result = await db.collection('groups').insertOne(group);

      // Check if the result is valid and contains the inserted ID
      if (result.insertedId) {
        // Retrieve the inserted group data
        const newGroup = {
          _id: result.insertedId,
          ...group
        };
        return res.status(201).json({ success: true, group: newGroup });
      } else {
        return res.status(500).json({ success: false, message: 'Failed to create group.' });
      }
    } catch (error) {
      console.error('Error creating group:', error); // Log the error for debugging
      return res.status(500).json({ success: false, error: 'Error creating group' });
    }
  });


  // Delete a group (Group Admin can delete their own groups)
  router.delete('/:id', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const groupId = req.params.id;
  
    try {
      if (!ObjectId.isValid(groupId)) {
        return res.status(400).send('Invalid groupId');
      }
  
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
      if (!group) {
        return res.status(404).send('Group not found');
      }
  
      const isSuperAdmin = req.user.roles.includes('super-admin');
      const isOriginalAdmin = group.adminId.toString() === req.user.id;
      const isPromotedAdmin = group.members.some(member => member.userId.toString() === req.user.id && member.role === 'group-admin');
  
      if (isSuperAdmin || isOriginalAdmin || isPromotedAdmin) {
        await db.collection('groups').deleteOne({ _id: new ObjectId(groupId) });
        return res.status(200).json({ success: true });
      } else {
        return res.status(403).send('Not authorized to delete this group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      return res.status(500).json({ error: 'Error deleting group' });
    }
  });
  

  // Create a channel within a group (Super Admin or Group Admin only)
  router.post('/:groupId/channels', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { name } = req.body;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
        const channel = { id: new ObjectId(), name };
        await db.collection('groups').updateOne(
          { _id: ObjectId(groupId) },
          { $push: { channels: channel } }
        );
        res.json({ success: true, channel });
      } else {
        res.status(403).send('Not authorized to create a channel in this group');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error creating channel' });
    }
  });

  // Delete a channel within a group (Super Admin or Group Admin only)
  router.delete('/:groupId/channels/:channelId', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId, channelId } = req.params;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
        await db.collection('groups').updateOne(
          { _id: ObjectId(groupId) },
          { $pull: { channels: { id: ObjectId(channelId) } } }
        );
        res.json({ success: true });
      } else {
        res.status(403).send('Not authorized to delete this channel');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting channel' });
    }
  });

  // Invite a user to a group (Group Admin or Super Admin only)
  router.post('/:groupId/invite', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      if (group.adminId === req.user.id || req.user.roles.includes('super-admin')) {
        await db.collection('groups').updateOne(
          { _id: ObjectId(groupId) },
          { $push: { invitations: { userId: ObjectId(userId) } } }
        );
        res.json({ success: true, message: 'User invited successfully' });
      } else {
        res.status(403).send('Not authorized to invite users to this group');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error inviting user' });
    }
  });

  // Add a member to a group (when the user accepts the invite)
  router.post('/:groupId/members', authorize(['user', 'group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      const inviteIndex = group.invitations.findIndex(invite => invite.userId === ObjectId(userId));
      if (inviteIndex === -1) {
        return res.status(403).send('User was not invited to this group');
      }

      await db.collection('groups').updateOne(
        { _id: ObjectId(groupId) },
        {
          $push: { members: { userId: ObjectId(userId), role: 'user' } },
          $pull: { invitations: { userId: ObjectId(userId) } }
        }
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error adding member to group' });
    }
  });

  // Promote a user to group admin (accessible by super-admin or current group admin)
  router.post('/:groupId/promote', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId, role } = req.body;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      const memberIndex = group.members.findIndex(m => m.userId === ObjectId(userId));
      if (memberIndex !== -1) {
        await db.collection('groups').updateOne(
          { _id: ObjectId(groupId), 'members.userId': ObjectId(userId) },
          { $set: { 'members.$.role': role } }
        );
        res.json({ success: true });
      } else {
        res.status(404).send('User not found in group');
      }
    } catch (error) {
      res.status(500).json({ error: 'Error promoting user' });
    }
  });

  // Remove a user from a group (Group Admin or Super Admin only)
  router.delete('/:groupId/users/:userId', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId, userId } = req.params;

    try {
      const group = await db.collection('groups').findOne({ _id: ObjectId(groupId) });

      if (!group) {
        return res.status(404).send('Group not found');
      }

      const memberIndex = group.members.findIndex(member => member.userId === ObjectId(userId));
      if (memberIndex !== -1) {
        await db.collection('groups').updateOne(
          { _id: ObjectId(groupId) },
          { $pull: { members: { userId: ObjectId(userId) } } }
        );
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: 'User not found in group' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error removing user from group' });
    }
  });

  // Add join request route
  router.post('/:groupId/join-request', authorize(['user', 'group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId, name } = req.body;
  
    // Ensure userId and name are present
    if (!userId || !name) {
      return res.status(400).json({ success: false, message: 'Invalid request data: userId and name are required.' });
    }
  
    try {
      // Convert groupId and userId to ObjectId
      const groupObjectId = new ObjectId(groupId);  // Convert groupId to ObjectId
      const userObjectId = new ObjectId(userId);    // Convert userId to ObjectId
  
      const group = await db.collection('groups').findOne({ _id: groupObjectId });
  
      if (!group) {
        return res.status(404).send('Group not found');
      }
  
      // Check if the user has already requested to join
      const alreadyRequested = group.joinRequests.some(req => req.userId.equals(userObjectId));
  
      if (!alreadyRequested) {
        // Add the join request
        await db.collection('groups').updateOne(
          { _id: groupObjectId },
          { $push: { joinRequests: { userId: userObjectId, name } } }
        );
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, message: 'User has already requested to join' });
      }
    } catch (error) {
      console.error('Error submitting join request:', error);
      res.status(500).json({ error: 'Error submitting join request' });
    }
  });
  

  // Approve join request
  router.post('/:groupId/approve-request', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    if (!ObjectId.isValid(groupId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid ObjectId' });
    }

    try {
      // Convert groupId and userId to ObjectId using `new ObjectId()`
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  
      if (group) {
        const requestIndex = group.joinRequests.findIndex(req => req.userId.equals(new ObjectId(userId)));
        
        if (requestIndex !== -1) {
          await db.collection('groups').updateOne(
            { _id: new ObjectId(groupId) },
            {
              $push: { members: { userId: new ObjectId(userId), role: 'user' } },
              $pull: { joinRequests: { userId: new ObjectId(userId) } }
            }
          );
          res.json({ success: true });
        } else {
          res.status(400).json({ success: false, message: 'Join request not found' });
        }
      } else {
        res.status(404).send('Group not found');
      }
    } catch (error) {
      console.error('Error approving join request:', error);
      res.status(500).json({ error: 'Error approving join request' });
    }
  });
  
  // Deny join request
  router.post('/:groupId/deny-request', authorize(['group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
  
    try {
      // Validate the groupId and userId
      if (!ObjectId.isValid(groupId) || !ObjectId.isValid(userId)) {
        return res.status(400).send('Invalid groupId or userId');
      }
  
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  
      if (group) {
        const requestIndex = group.joinRequests.findIndex(req => req.userId.toString() === userId);
        if (requestIndex !== -1) {
          await db.collection('groups').updateOne(
            { _id: new ObjectId(groupId) },
            { $pull: { joinRequests: { userId: new ObjectId(userId) } } }
          );
          return res.status(200).json({ success: true });
        } else {
          return res.status(400).json({ success: false, message: 'Join request not found' });
        }
      } else {
        return res.status(404).send('Group not found');
      }
    } catch (error) {
      console.error('Error denying join request:', error);
      return res.status(500).json({ error: 'Error denying join request' });
    }
  });  

  // Route for a user to leave a group
  router.post('/:groupId/leave', authorize(['user', 'group-admin', 'super-admin']), async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;
  
    try {
      if (!ObjectId.isValid(groupId) || !ObjectId.isValid(userId)) {
        return res.status(400).send('Invalid groupId or userId format');
      }
  
      const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  
      if (group) {
        // Remove the user from the members list
        await db.collection('groups').updateOne(
          { _id: new ObjectId(groupId) },
          { $pull: { members: { userId: new ObjectId(userId) } } }
        );
  
        // Check if the user leaving is the group admin and there are still members left
        if (group.adminId.toString() === userId && group.members.length > 0) {
          const newAdmin = group.members[0].userId;
          await db.collection('groups').updateOne(
            { _id: new ObjectId(groupId) },
            { $set: { adminId: new ObjectId(newAdmin), 'members.0.role': 'admin' } }
          );
        }
  
        res.json({ success: true });
      } else {
        res.status(404).send('Group not found');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      res.status(500).json({ error: 'Error leaving group' });
    }
  });
  
  router.get('/invitations', async (req, res) => {
    const userId = req.headers['user-id']; // Get the user ID from the request headers

    try {
      // Find all groups where the user has been invited
      const groups = await db.collection('groups').find({
        invitations: { $elemMatch: { userId: userId } }
      }).toArray();

      res.json({ success: true, invitations: groups });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ success: false, message: 'Error fetching invitations' });
    }
  });

  return router;
};
