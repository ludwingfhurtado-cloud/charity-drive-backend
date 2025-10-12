// server/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Enable __dirname in ES Modules
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load environment variables (only if not in Railway/production)
if (!process.env.RAILWAY_ENVIRONMENT) {
    dotenv.config({ path: path.join(__dirname, ".env.local") });
    dotenv.config({ path: path.join(__dirname, ".env") });
}

// ✅ Initialize Express
const app = express();

// ✅ CORS - Allow frontend URL or wildcard in development
const allowedOrigins = process.env.FRONTEND_URL ?
    [process.env.FRONTEND_URL] :
    ['*'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

// ✅ Health check routes (important for Railway)
app.get('/', (_req, res) => {
    res.send('✅ Charity Drive API running');
});

app.get('/healthz', (_req, res) => {
    res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ✅ Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI environment variable");
    console.error("📋 Available env vars:", Object.keys(process.env).filter(k => !k.includes('SECRET')));
} else {
    console.log("✅ MONGODB_URI is present");
    console.log("📋 Connection string starts with:", MONGODB_URI.substring(0, 20));

    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log("✅ Successfully connected to MongoDB");
            console.log("📊 Database:", mongoose.connection.name);
        })
        .catch(err => {
            console.error("❌ MongoDB connection error:", err.message);
        });
}

// ✅ Graceful shutdown handler
process.on('SIGTERM', async() => {
    console.log('⚠️ SIGTERM received, closing server gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

// ✅ Start Server - Bind to Railway's port and all interfaces
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Important for containers/Railway

app.listen(PORT, HOST, () => {
    console.log(`🚀 Charity Drive backend running on ${HOST}:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});