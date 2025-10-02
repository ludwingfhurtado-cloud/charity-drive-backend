
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch'); // <-- ADD THIS LINE
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
    });

// --- API Routes ---

// GET / - Health Check Endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Charity Drive server is running' });
});

// NEW: GET /api/reverse-geocode - Handle reverse geocoding from the backend
app.get('/api/reverse-geocode', async (req, res) => {
  const { lat, lng, lang = 'es' } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'Missing latitude or longitude parameters.' });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'CharityDriveWebApp/1.0',
        'Accept-Language': lang
      }
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Nominatim reverse geocode failed:', response.status, errorText);
        throw new Error(`Nominatim API responded with status: ${response.status}`);
    }
    const data = await response.json();

    // Enhanced logging to debug Nominatim responses
    console.log('Nominatim Raw Response:', data);
    if (!data.display_name) {
        console.warn('Warning: Nominatim response was successful but did not contain a display_name.');
    }

    res.json({ address: data.display_name });
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(500).json({ message: 'Failed to get address from geocoding service.' });
  }
});

// NEW: GET /api/search-locations - Handle location search from the backend
app.get('/api/search-locations', async (req, res) => {
    const { query, lang = 'es' } = req.query;

    if (!query || query.trim().length < 3) {
        return res.status(400).json({ message: 'Search query must be at least 3 characters long.' });
    }

    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'CharityDriveWebApp/1.0',
                'Accept-Language': lang
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Nominatim search failed:', response.status, errorText);
            throw new Error(`Nominatim API responded with status: ${response.status}`);
        }
        const data = await response.json();
        const results = data.map((item) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.display_name,
        }));
        res.json(results);
    } catch (err) {
        console.error('Search locations error:', err.message);
        res.status(500).json({ message: 'Failed to search for locations.' });
    }
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
        
        // Defensive Payload Construction
        const rideData = {
            pickup,
            dropoff,
            pickupAddress,
            dropoffAddress,
            // Explicitly sanitize the rideOption object
            rideOption: {
                id: rideOption.id,
                multiplier: rideOption.multiplier
            },
            suggestedFare,
            finalFare,
            distanceInKm,
            travelTimeInMinutes,
            status: 'pending'
        };
        
        // Explicitly sanitize and add the charity object if it's valid
        if (charity && charity.id && charity.name) {
            rideData.charity = {
                id: charity.id,
                name: charity.name,
                description: charity.description || '' // Default description if missing
            };
        }

        const newRide = new Ride(rideData);
        await newRide.save();
        res.status(201).json(newRide);
    } catch (error) {
        console.error('Error creating ride:', error.message);
        // Provide more detailed validation error in development
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

const effectivePort = process.env.PORT || 3001;
app.listen(effectivePort, () => {
    console.log(`Charity Drive server listening on port: ${effectivePort}`);
});