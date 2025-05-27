// server.js - Backend server
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

const cors = require("cors");

const app = express();
app.use(
    cors({
        origin: [
            "https://streakmaintainer.vercel.app",
            "http://localhost:5173"
        ],
        credentials: true,
    })
);

app.use(express.json());

// MongoDB connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Streak Schema
const streakSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompleted: String,
    completedDates: [String],
    createdAt: { type: Date, default: Date.now },
});

const Streak = mongoose.model("Streak", streakSchema);

// Routes
// Get all streaks
app.get("/api/streaks", async (req, res) => {
    try {
        const streaks = await Streak.find().sort({ createdAt: -1 });
        res.json(streaks);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch streaks" });
    }
});

app.get("/api/", (req, res) => {
    res.send("Welcome to the Streak Maintainer API!");
});

// Create new streak
app.post("/api/streaks", async (req, res) => {
    try {
        const { name, description } = req.body;
        const streak = new Streak({ name, description });
        await streak.save();
        res.status(201).json(streak);
    } catch (error) {
        res.status(500).json({ error: "Failed to create streak" });
    }
});

// Update streak (mark complete)
app.put("/api/streaks/:id/complete", async (req, res) => {
    try {
        const streak = await Streak.findById(req.params.id);
        if (!streak) return res.status(404).json({ error: "Streak not found" });

        const today = new Date().toDateString();

        // Check if already completed today
        if (streak.completedDates.includes(today)) {
            return res.json(streak);
        }

        const lastCompleted = streak.lastCompleted
            ? new Date(streak.lastCompleted)
            : null;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let newCurrentStreak;
        if (
            !lastCompleted ||
            lastCompleted.toDateString() === yesterday.toDateString()
        ) {
            newCurrentStreak = streak.currentStreak + 1;
        } else {
            newCurrentStreak = 1;
        }

        streak.currentStreak = newCurrentStreak;
        streak.longestStreak = Math.max(streak.longestStreak, newCurrentStreak);
        streak.lastCompleted = today;
        streak.completedDates.push(today);

        await streak.save();
        res.json(streak);
    } catch (error) {
        res.status(500).json({ error: "Failed to update streak" });
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to the Streak Maintainer API!");
});
// Delete streak
app.delete("/api/streaks/:id", async (req, res) => {
    try {
        await Streak.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Failed to delete streak" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// package.json dependencies needed:
/*
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5"
  }
}
*/
