// server.js (MongoDB integrated version)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const Ride = require('./models/Ride');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- Connect to MongoDB Atlas ---
mongoose.connect('mongodb+srv://ludwingfhurtado_db_user:NrPvo2zC2MY5ZwD@cluster0.xxxxxx.mongodb.net/charityrides?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// --- API Routes ---

// Create a new ride
app.post('/api/rides', async(req, res) => {
    try {
        const newRide = new Ride({...req.body, status: 'waiting' });
        await newRide.save();
        res.status(201).json(newRide);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all available rides
app.get('/api/rides', async(req, res) => {
    try {
        const rides = await Ride.find({ status: 'waiting' });
        res.json(rides);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Accept a ride
app.post('/api/rides/:id/accept', async(req, res) => {
    try {
        const ride = await Ride.findOneAndUpdate({ id: req.params.id, status: 'waiting' }, { status: 'en_route' }, { new: true });
        if (!ride) return res.status(404).json({ success: false, message: 'Ride not found or already accepted.' });
        res.json({ success: true, ride });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cancel a ride
app.delete('/api/rides/:id', async(req, res) => {
    try {
        const result = await Ride.findOneAndDelete({ id: req.params.id, status: 'waiting' });
        if (!result) return res.json({ success: true, message: 'Ride not found or already accepted.' });
        res.json({ success: true, message: `Ride ${req.params.id} cancelled.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update ride status (e.g., in_progress, picked_up)
app.post('/api/rides/:id/status', async(req, res) => {
    try {
        const { status } = req.body;
        const ride = await Ride.findOneAndUpdate({ id: req.params.id }, { status }, { new: true });
        if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
        res.json({ success: true, ride });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Complete ride and log payment/charity
app.post('/api/rides/:id/complete', async(req, res) => {
    try {
        const { charity, confirmedPayment } = req.body;
        const ride = await Ride.findOneAndUpdate({ id: req.params.id }, { charity, paymentConfirmed: confirmedPayment, status: 'completed' }, { new: true });
        if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });
        res.json({ success: true, message: 'Ride completed.', ride });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Charity backend running at http://localhost:${PORT}`);
});