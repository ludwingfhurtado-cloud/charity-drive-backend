// ================================================
// 🌍 Charity Drive Backend Server (ESM compatible)
// ================================================

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ================================================
// 🧭 Enable __dirname in ES modules
// ================================================
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// ================================================
// 🔒 Load environment variables
// ================================================
dotenv.config({ path: path.join(__dirname, ".env") });

// ================================================
// 🚀 Initialize Express
// ================================================
const app = express();

// ================================================
// 🌐 CORS configuration
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
// 🩺 Health check routes
// ================================================
app.get("/", (_req, res) => {
    res.send("✅ Charity Drive API running");
});

app.get("/healthz", (_req, res) => {
    res.status(200).json({
        ok: true,
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});

// ================================================
// 💾 Connect to MongoDB
// ================================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI in environment variables");
    process.exit(1);
}

console.log("✅ MONGODB_URI detected");
console.log("📋 Prefix:", MONGODB_URI.substring(0, 12));

mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
        console.log("✅ Connected to MongoDB");
        console.log("📊 Database:", mongoose.connection.name);
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// ================================================
// ⚡ Serve frontend (optional)
// ================================================
const frontendPath = path.join(__dirname, "dist");
app.use(express.static(frontendPath));

// Fallback route for SPA
app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ================================================
// ⚙️ Start server
// ================================================
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
    console.log(`🚀 Charity Drive backend live at http://${HOST}:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
});