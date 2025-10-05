// =====================================
// Charity Drive Server
// =====================================
// John 3:16 – For God so loved the world 🌍
// =====================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Ride = require('./models/Ride');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================
// Middleware
// =====================================
app.use(cors());
app.use(express.json());

// =====================================
// MongoDB Connection
// =====================================

const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://ludwingfhurtado_db_user:8AQ215mlNBb6aGos@cluster0.bo6gfdh.mongodb.net/charitydrive?retryWrites=true&w=majority&appName=Cluster0";

if (!MONGODB_URI) {
    console.error("❌ FATAL ERROR: MONGODB_URI is not defined in .env");
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log("✅ Successfully connected to MongoDB."))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// =====================================
// Routes
// =====================================

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🚀 Charity Drive server is running smoothly.' });
});

// Fetch available rides
app.get('/api/rides', async(req, res) => {
    try {
        const availableRides = await Ride.find({ status: 'pending' });
        res.json(availableRides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create new ride request
app.post('/api/rides', async(req, res) => {
    try {
        const {
            pickup,
            dropoff,
            pickupAddress,
            dropoffAddress,
            rideOption = {},
            suggestedFare,
            finalFare,
            distanceInKm,
            travelTimeInMinutes,
            charity,
        } = req.body;

        const newRide = new Ride({
            pickup,
            dropoff,
            pickupAddress,
            dropoffAddress,
            rideOption: {
                id: rideOption.id,
                multiplier: rideOption.multiplier,
            },
            suggestedFare,
            finalFare,
            distanceInKm,
            travelTimeInMinutes,
            charity,
            status: 'pending',
        });

        await newRide.save();
        res.status(201).json(newRide);
    } catch (error) {
        console.error('Error creating ride:', error.message);
        res.status(400).json({
            message: 'Invalid ride data provided.',
            error: error.message,
        });
    }
});

// Accept ride
app.post('/api/rides/:id/accept', async(req, res) => {
    try {
        const ride = await Ride.findByIdAndUpdate(req.params.id, { status: 'accepted' }, { new: true });
        if (!ride) return res.status(404).json({ message: 'Ride not found.' });
        res.status(200).json({ message: 'Ride accepted successfully.' });
    } catch (error) {
        console.error('Error accepting ride:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Cancel/Delete ride
app.delete('/api/rides/:id', async(req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid ride ID.' });
        }

        const ride = await Ride.findByIdAndDelete(req.params.id);
        if (!ride) return res.status(404).json({ message: 'Ride not found.' });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting ride:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// =====================================
// Server Start
// =====================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Charity Drive server listening on port ${PORT}`);
});