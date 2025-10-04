// =====================================
// Charity Drive Server
// =====================================
// John 3:16 – For God so loved the world 🌍
// =====================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Ride = require('./models/Ride');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// =====================================
// Socket.IO Setup
// =====================================
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// =====================================
// Middleware
// =====================================
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// =====================================
// MongoDB Connection
// =====================================
const MONGODB_URI =
    process.env.MONGODB_URI ||
    'mongodb+srv://ludwingfhurtado_db_user:8AQ215mlNBb6aGos@cluster0.bo6gfdh.mongodb.net/charitydrive?retryWrites=true&w=majority&appName=Cluster0';

if (!MONGODB_URI) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
}

mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('✅ Successfully connected to MongoDB.'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// =====================================
// Health Check
// =====================================
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🚀 Charity Drive server is running smoothly.' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend running fine 🚀' });
});

// =====================================
// Socket.IO Event Handlers
// =====================================
io.on('connection', async(socket) => {
    console.log('✅ Client connected:', socket.id);

    try {
        const rides = await Ride.find({ status: 'pending' });
        socket.emit('ride-list-update', rides);
    } catch (err) {
        console.error('❌ Error sending initial rides:', err);
    }

    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });

    socket.on('join-ride-room', (rideId) => {
        socket.join(rideId);
        console.log(`🚪 Socket ${socket.id} joined ride room ${rideId}`);
    });

    socket.on('new-ride', async() => {
        try {
            const rides = await Ride.find({ status: 'pending' });
            io.emit('ride-list-update', rides);
        } catch (err) {
            console.error('❌ Error handling new-ride:', err);
        }
    });

    socket.on('ride-cancelled', async() => {
        try {
            const rides = await Ride.find({ status: 'pending' });
            io.emit('ride-list-update', rides);
        } catch (err) {
            console.error('❌ Error handling ride-cancelled:', err);
        }
    });

    socket.on('accept-ride', async(payload) => {
        try {
            const updatedRides = await Ride.find({ status: 'pending' });
            io.emit('ride-list-update', updatedRides);
            io.emit('ride-accepted', payload);
        } catch (err) {
            console.error('❌ Error handling accept-ride:', err);
        }
    });

    socket.on('send-message', (payload) => {
        if (payload.rideId) {
            io.to(payload.rideId).emit('new-message', payload);
        } else {
            console.warn('⚠️ Received send-message without rideId.');
        }
    });
});

// =====================================
// Start Server
// =====================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Charity Drive server listening on port ${PORT}`);
});