const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with the server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'user-roles', 'group-data'],
  },
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'user-roles', 'group-data'],
}));

app.use(express.json()); // to handle JSON bodies

// Middleware for uploading images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-images');  // Define the folder where profile images are stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name collisions
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// MongoDB connection
const mongoURI = 'mongodb://localhost:27017';
const dbName = 'mydb';

MongoClient.connect(mongoURI)
  .then(client => {
    console.log('Connected to MongoDB...');
    const db = client.db(dbName);
    
    app.locals.db = db;

    // Now require and pass the db to routes after connection is established
    const userRoutes = require('./routes/userRoutes')(db);
    const groupRoutes = require('./routes/groupRoutes')(db);
    const channelRoutes = require('./routes/channelRoutes')(db);

    // Serve static files from the 'uploads' folder
    app.use('/uploads', express.static('uploads')); // This will make the images publicly accessible

    // Apply middleware and routes
    app.use('/api/users', userRoutes);
    app.use('/api/groups', groupRoutes);  // Ensure authentication where necessary
    app.use('/api/channels', channelRoutes);  // Ensure authentication where necessary

    // Root route
    app.get('/', (req, res) => {
      res.send('Chat Server is running');
    });

    // Route to upload profile image
    app.post('/api/users/upload-avatar', upload.single('profileImage'), async (req, res) => {
      const userId = req.headers['user-id'];  // Get user ID from the request headers

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      try {
        const avatarPath = req.file.path;  // Path to the uploaded image

        // Convert userId to ObjectId
        const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;

        if (!objectId) {
          throw new Error('Invalid User ID');
        }

        // Update the user document with the avatar path
        const result = await db.collection('users').updateOne(
          { _id: objectId },
          { $set: { avatar: avatarPath } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Avatar uploaded successfully', avatarPath });
      } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ message: 'Error uploading avatar', error: error.message });
      }
    });


    // Socket.io integration
    io.on('connection', (socket) => {
      console.log('New client connected');
    
      socket.on('sendMessage', (messageData) => {
        console.log('Message received:', messageData);
    
        // Emit the message back to all clients in the specific channel
        io.to(messageData.channelId).emit('messageReceived', messageData);
      });
    
      socket.on('joinChannel', (channelId) => {
        socket.join(channelId);
        console.log(`User joined channel: ${channelId}`);
      });
    
      socket.on('leaveChannel', (channelId) => {
        socket.leave(channelId);
        console.log(`User left channel: ${channelId}`);
      });
    
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
    
    // Start the server
    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
    
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });
