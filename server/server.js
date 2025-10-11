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

// ✅ Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

// ✅ Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Successfully connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Simple Health Check Endpoint
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Charity Drive server listening on port ${PORT}`);
});