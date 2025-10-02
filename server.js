require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Ride = require('./models/Ride');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Don't exit on initial connection error, allow for retries by the driver.
    });

// --- API Routes ---

// GET / - Health Check Endpoint
app.get('/', (req, res) => {
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

        // SANITIZE THE DATA: Create a new ride object with only the fields defined in the schema.
        const newRide = new Ride({
            pickup,
            dropoff,
            pickupAddress,
            dropoffAddress,
            rideOption: {
                id: rideOption.id,
                multiplier: rideOption.multiplier
            },
            suggestedFare,
            finalFare,
            distanceInKm,
            travelTimeInMinutes,
            // Explicitly create the charity object to match the schema.
            charity: {
                id: charity.id,
                name: charity.name,
                description: charity.description
            },
            status: 'pending'
        });

        await newRide.save();
        res.status(201).json(newRide);
    } catch (error) {
        console.error('Error creating ride:', error.message);
        res.status(400).json({ message: 'Invalid ride data provided.', error: error.message });
    }
});

// POST /api/rides/:id/accept - A driver accepts a ride
app.post('/api/rides/:id/accept', async (req, res) => {
    try {
        const ride = await Ride.findByIdAndUpdate(
            req.params.id, 
            { status: 'accepted' }, 
            { new: true }
        );

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found.' });
        }
        
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

        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting ride:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Determine port for Railway, but fallback to 3001 for local dev.
const effectivePort = process.env.PORT || 3001;
app.listen(effectivePort, '0.0.0.0', () => {
    console.log(`Charity Drive server listening on port: ${effectivePort}`);
});