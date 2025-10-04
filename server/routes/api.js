const express = require('express');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const Ride = require('../models/Ride');

const router = express.Router();

// NEW: Handle reverse geocoding from the backend using OpenStreetMap
router.get('/reverse', async (req, res) => {
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

    const responseText = await response.text();
    let data;

    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error("❌ Nominatim reverse geocode response was not valid JSON. Raw response:", responseText);
        return res.status(500).json({ message: "Invalid response from geocoding service." });
    }
    
    if (!response.ok) {
        console.error(`Nominatim API responded with status ${response.status}: ${responseText}`);
        return res.status(500).json({ message: `Geocoding service failed with status ${response.status}` });
    }
    
    if (!data.display_name) {
      console.warn(`Warning: Nominatim response for lat=${lat}, lng=${lng} was successful but did not contain a display_name.`);
      return res.json({ address: "Address not found" });
    }
    res.json({ address: data.display_name });
  } catch (err) {
    console.error('Reverse geocode error:', err.message);
    res.status(500).json({ message: 'Failed to get address from geocoding service.' });
  }
});

// NEW: Handle location search from the backend using OpenStreetMap
router.get('/search-locations', async (req, res) => {
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

        const responseText = await response.text();
        let data;

        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("❌ Nominatim search response was not valid JSON. Raw response:", responseText);
            return res.status(500).json({ message: "Invalid response from location search service." });
        }

        if (!response.ok) {
            console.error(`Nominatim API responded with status ${response.status}: ${responseText}`);
            return res.status(500).json({ message: `Location search service failed with status ${response.status}` });
        }
        
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

// Fetch all available ride requests
router.get('/rides', async (req, res) => {
    try {
        const availableRides = await Ride.find({ status: 'pending' });
        res.json(availableRides);
    } catch (error) {
        console.error('Error fetching rides:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Create a new ride request
router.post('/rides', async (req, res) => {
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
            status: 'pending'
        };
        
        if (charity && charity.id && charity.name) {
            rideData.charity = {
                id: charity.id,
                name: charity.name,
                description: charity.description || ''
            };
        }

        const newRide = new Ride(rideData);
        await newRide.save();
        res.status(201).json(newRide);
    } catch (error) {
        console.error('Error creating ride:', error.message);
        res.status(400).json({ message: 'Invalid ride data provided.', error: error.message });
    }
});

// A driver accepts a ride
router.post('/rides/:id/accept', async (req, res) => {
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

// A rider cancels their request
router.delete('/rides/:id', async (req, res) => {
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

module.exports = router;