require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch');
const http = require('http');
const { Server } = require('socket.io');
const Ride = require('./models/Ride');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity in development
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined in the server/.env file.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('\n---');
        console.error('💡 COMMON FIXES:');
        console.error('   1. Password: Make sure you replaced "<db_password>" in your server/.env file with your actual password.');
        console.error('   2. IP Access List: Ensure your current IP address is whitelisted in MongoDB Atlas.');
        console.error('      (In Atlas: Network Access -> Add IP Address -> "Allow Access From Anywhere" for testing)');
        console.error('---');
        process.exit(1); // Exit if DB connection fails
    });

// --- Socket.IO Real-time Logic ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRideRoom', (rideId) => {
    socket.join(rideId);
    console.log(`Socket ${socket.id} joined room for ride ${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// --- API Routes ---

// GET / - Health Check Endpoint for deployment (e.g., Railway)
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Charity Drive server is running' });
});

// NEW: GET /api/health - Health Check for Frontend test button
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Charity Drive server is running' });
});

// GET /api/rides - Fetch all available ride requests
app.get('/api/rides', async (req, res) => {
    try {
        const availableRides = await Ride.find({ status: 'pending' });
        res.json(availableRides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST /api/rides - Create a new ride request
app.post('/api/rides', async (req, res) => {
    try {
        const {
            pickup,
            dropoff,
            pickupAddress,
            dropoffAddress,
            rideOption,
            suggestedFare,
            finalFare,
            distanceInKm,
            travelTimeInMinutes,
            charity
        } = req.body;
        
        const rideData = {
            pickup, dropoff, pickupAddress, dropoffAddress,
            rideOption: { id: rideOption.id, multiplier: rideOption.multiplier },
            suggestedFare, finalFare, distanceInKm, travelTimeInMinutes, status: 'pending'
        };
        
        if (charity && charity.id && charity.name) {
            rideData.charity = { id: charity.id, name: charity.name, description: charity.description || '' };
        }

        const newRide = new Ride(rideData);
        await newRide.save();
        
        // Real-time update: Notify all clients (drivers) about the new ride.
        io.emit('newRide', newRide.toJSON());

        res.status(201).json(newRide);
    } catch (error) {
        console.error('Error creating ride:', error.message);
        res.status(400).json({ message: 'Invalid ride data provided.', error: error.message });
    }
});

// POST /api/rides/:id/accept - A driver accepts a ride
app.post('/api/rides/:id/accept', async (req, res) => {
    try {
        const ride = await Ride.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' }, // Ensure we only accept pending rides
            { status: 'accepted' }, 
            { new: true }
        );

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found or already accepted.' });
        }
        
        // Real-time update: Notify the specific rider who booked the ride.
        io.to(ride.id).emit('rideAccepted', ride.id);

        // Real-time update: Notify all drivers to remove the ride from their list.
        const updatedRides = await Ride.find({ status: 'pending' });
        io.emit('rideListUpdate', updatedRides);
        
        res.status(200).json({ message: 'Ride accepted successfully.' });
    } catch (error) {
        console.error('Error accepting ride:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// DELETE /api/rides/:id - A rider cancels their request
app.delete('/api/rides/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Ride not found.' });
        }
        const ride = await Ride.findByIdAndDelete(req.params.id);

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found.' });
        }
        
        // Real-time update: Notify all drivers that the ride has been cancelled.
        const updatedRides = await Ride.find({ status: 'pending' });
        io.emit('rideListUpdate', updatedRides);

        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting ride:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Remove unused location endpoints as the client now uses Google Maps API directly
// app.get('/api/reverse', ...);
// app.get('/api/search-locations', ...);

const effectivePort = process.env.PORT || 3001;
server.listen(effectivePort, () => {
    console.log(`Charity Drive server with real-time support listening on port: ${effectivePort}`);
});