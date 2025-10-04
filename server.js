require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const Ride = require('./models/Ride');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRoutes);

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ FATAL ERROR: MONGODB_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// --- Socket.IO Connection Handling ---
io.on('connection', async (socket) => {
  console.log('✅ Client connected via Socket.IO:', socket.id);

  try {
    const rides = await Ride.find({ status: 'pending' });
    socket.emit('ride-list-update', rides);
  } catch (error) {
    console.error('❌ Error sending initial ride list:', error);
  }

  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));

  socket.on('join-ride-room', (rideId) => {
    socket.join(rideId);
    console.log(`🚪 Socket ${socket.id} joined room ${rideId}`);
  });

  socket.on('new-ride', async () => {
    const rides = await Ride.find({ status: 'pending' });
    io.emit('ride-list-update', rides);
  });

  socket.on('ride-cancelled', async () => {
    const rides = await Ride.find({ status: 'pending' });
    io.emit('ride-list-update', rides);
  });

  socket.on('accept-ride', async (payload) => {
    const updatedRides = await Ride.find({ status: 'pending' });
    io.emit('ride-list-update', updatedRides);
    io.emit('ride-accepted', payload);
  });

  socket.on('send-message', (payload) => {
    if (payload.rideId) io.to(payload.rideId).emit('new-message', payload);
  });
});

// --- Health Routes ---
app.get('/', (req, res) => res.send('🚀 Charity Drive Backend is alive and well.'));
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend running fine 🚀" });
});

// --- Server Startup ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Charity Drive server listening on port ${PORT}`);
});