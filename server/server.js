// ================================================
// 🌍 Charity Drive Backend Server (Production Ready)
// ================================================

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ================================================
// 🔧 Enable __dirname in ES Modules
// ================================================
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// ================================================
// 🔒 Load environment variables (local only)
// Railway provides env vars automatically
// ================================================
if (!process.env.RAILWAY_ENVIRONMENT) {
    dotenv.config({ path: path.join(__dirname, ".env.local") });
    dotenv.config({ path: path.join(__dirname, ".env") });
}

// ================================================
// 🚀 Initialize Express App
// ================================================
const app = express();

// ================================================
// 🌐 Configure CORS
// Allow frontend URL in production, all origins in dev
// ================================================
const allowedOrigins = process.env.FRONTEND_URL ?
    [process.env.FRONTEND_URL] :
    ["*"];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json());

// ================================================
// 🩺 Health Check Routes (important for Railway)
// ================================================
app.get("/", (_req, res) => {
    res.send("✅ Charity Drive API running");
});

app.get("/healthz", (_req, res) => {
    res.status(200).json({
        ok: true,
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// ================================================
// 💾 Connect to MongoDB
// ================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI environment variable");
    console.error(
        "📋 Available env vars:",
        Object.keys(process.env).filter((k) => !k.toLowerCase().includes("secret"))
    );
} else {
    console.log("✅ MONGODB_URI detected");
    console.log("📋 Prefix:", MONGODB_URI.substring(0, 12));

    mongoose
        .connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // ⏱ graceful timeout
        })
        .then(() => {
            console.log("✅ Successfully connected to MongoDB");
            console.log("📊 Database:", mongoose.connection.name);
        })
        .catch((err) => {
            console.error("❌ MongoDB connection error:", err.message);
            process.exit(1); // ⛔ stop container if DB fails
        });
}

// ================================================
// 🧹 Graceful Shutdown
// ================================================
process.on("SIGTERM", async() => {
    console.log("⚠️ SIGTERM received — closing gracefully...");
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed");
    process.exit(0);
});

// ================================================
// ⚡ Start Server (Railway uses dynamic PORT)
// ================================================
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0"; // must bind to all interfaces

app.listen(PORT, HOST, () => {
    console.log(`🚀 Charity Drive backend live at http://${HOST}:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});