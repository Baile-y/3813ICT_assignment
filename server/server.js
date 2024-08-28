const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());

// Dummy users for demonstration (replace with a real database in production)
const users = [
  { id: 1, username: 'user', password: 'password', role: 'User' },
  { id: 2, username: 'bailey', password: 'hello', role: 'Admin' },
];

// Dummy groups data (replace with a real database in production)
const groups = [];

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  console.log(groups);
  next();
});

// Authentication route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Create a token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'secret-key', { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Example of a protected route
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: 'This is protected data' });
});

// Route to create a new group (admin only)
app.get('/api/groups', verifyToken, (req, res) => {
  try {
    if (!groups) {
      throw new Error('Groups array is undefined or null');
    }
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);  // Log the error details
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/api/groups', verifyToken, (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const user = users.find(u => u.id === req.userId);

    if (user && user.role === 'Admin') {
      const newGroup = {
        id: groups.length + 1,
        name: name,
        channels: []
      };

      groups.push(newGroup);
      res.status(201).json(newGroup);
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Error creating group:', error);  // Log the error details
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// Route to get all groups (for both users and admins)
app.get('/api/groups', verifyToken, (req, res) => {
  res.json(groups);
});

// Socket.io setup for real-time communication
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('sendMessage', (message) => {
    io.emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Middleware to verify the token
function verifyToken(req, res, next) {
  // Retrieve the token from the Authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // The token should be in the format "Bearer <token>"
  const token = authHeader.split(' ')[1]; // Extract the token part after "Bearer"

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  // Verify the token using the secret key
  jwt.verify(token, 'secret-key', (err, decoded) => {
    if (err) {
      console.error('Failed to authenticate token:', err);
      return res.status(500).json({ message: 'Failed to authenticate token' });
    }
    // Token is valid, attach the decoded payload to the request object
    req.userId = decoded.id;
    next(); // Move on to the next middleware or route handler
  });
}

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use((req, res) => {
  res.status(404).send('Route not found');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
