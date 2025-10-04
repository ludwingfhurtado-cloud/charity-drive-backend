require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const Ride = require('./models/Ride');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Socket.IO Connection Handling ---
io.on('connection', async (socket) => {
  console.log('✅ Client connected via Socket.IO:', socket.id);

  // Send the current list of pending rides to the newly connected client
  try {
    const rides = await Ride.find({ status: 'pending' });
    socket.emit('ride-list-update', rides);
  } catch (error) {
    console.error('❌ Error sending initial ride list to client:', socket.id, error);
  }

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
  
  // Handler for clients to join a ride-specific room
  socket.on('join-ride-room', (rideId) => {
    socket.join(rideId);
    console.log(`🚪 Socket ${socket.id} joined room for ride ${rideId}`);
  });

  // Listen for specific, named events from the client
  socket.on('new-ride', async (payload) => {
    try {
        const rides = await Ride.find({ status: 'pending' });
        io.emit('ride-list-update', rides); // Broadcast to all clients
    } catch (error) {
        console.error('❌ Error handling new-ride:', error);
    }
  });
  
  socket.on('ride-cancelled', async (payload) => {
    try {
        const rides = await Ride.find({ status: 'pending' });
        io.emit('ride-list-update', rides);
    } catch (error) {
        console.error('❌ Error handling ride-cancelled:', error);
    }
  });

  socket.on('accept-ride', async (payload) => {
    try {
        const updatedRides = await Ride.find({ status: 'pending' });
        io.emit('ride-list-update', updatedRides); // Update ride list for drivers
        io.emit('ride-accepted', payload);       // Notify passenger
    } catch (error) {
        console.error('❌ Error handling accept-ride:', error);
    }
  });

  // UPDATED: Send message only to the specific ride's room
  socket.on('send-message', (payload) => {
      if (payload.rideId) {
        // Broadcast the message only to clients in the specified room
        io.to(payload.rideId).emit('new-message', payload);
      } else {
        console.warn('⚠️ Received send-message event without rideId. Message not sent.');
      }
  });

});

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

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend running fine 🚀' });
});

// --- Server Startup ---
const effectivePort = process.env.PORT || 3001;
// Listen on all network interfaces, which is crucial for deployment platforms like Railway
server.listen(effectivePort, () => {
    console.log(`🚀 Charity Drive server listening on port: ${effectivePort}`);
});