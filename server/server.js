// server/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// Define allowed origins for re-use
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? "https://study-sync-mern-project.vercel.app"
  : "http://localhost:5173";

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  // Use default transports, client will negotiate
  transports: ['polling', 'websocket'],
  // Increased timeouts can help with platform stability
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Create rooms object to track active users
const socketRooms = {};

// Store io and socketRooms in app for routes to access
app.set('io', io);
app.set('socketRooms', socketRooms);

// Initialize socket handling with the rooms object
require('./sockets/socket')(io, socketRooms);

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Root route for health check
app.get('/', (req, res) => {
  res.send('StudySync API is running');
});

// Socket.IO health check
app.get('/socket.io/health', (req, res) => {
  res.json({ status: 'Socket.IO server is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));