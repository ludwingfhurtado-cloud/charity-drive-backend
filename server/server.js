// ===========================================
// ✅ Charity Drive Backend - Production Ready
// ===========================================
// Author: Don Lu
// Purpose: Express + MongoDB backend optimized for Railway
// ===========================================

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();

// ==============================
// 🔹 Middleware
// ==============================
app.use(cors({ origin: "*" })); // TODO: replace "*" with your frontend domain in production
app.use(express.json());

// ==============================
// 🔹 Health & Root Endpoints (for Railway)
// ==============================
app.get("/", (_req, res) => res.send("✅ Charity Drive API running"));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

// ==============================
// 🔹 MongoDB Connection
// ==============================
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("❌ Missing MONGODB_URI environment variable.");
    process.exit(1);
}

mongoose
    .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ Successfully connected to MongoDB"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// ==============================
// 🔹 Example API Route
// ==============================
app.get("/api/example", (_req, res) => {
    res.json({
        message: "🚀 Charity Drive API is fully operational.",
        version: "1.0.0",
    });
});

// ==============================
// 🔹 Server Listen
// ==============================
const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0"; // Required for Railway containers

app.listen(PORT, HOST, () => {
    console.log(`✅ Charity Drive server listening on port ${PORT}`);
});