const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// CORS configuration
app.use(cors({
  origin: 'http://localhost:4200', // Adjust this based on your frontend's origin
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'group-data', 'user-roles', 'user-id'],
}));

app.use(express.json());

// Import route modules
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const channelRoutes = require('./routes/channelRoutes');

// Authentication middleware
const authenticate = (req, res, next) => {
  const role = req.body.role || req.headers['user-roles']; // Adjust to your role check logic
  if (role) {
    req.role = role;
    next();
  } else {
    res.status(403).send('Not authorized');
  }
};

// Apply middleware and routes
app.use('/api/users', userRoutes);
app.use('/api/groups', authenticate, groupRoutes);
app.use('/api/channels', authenticate, channelRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Chat Server is running');
});

// Start server
server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
