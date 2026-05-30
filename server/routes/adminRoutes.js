const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/clients", protect, adminOnly, async (req, res) => {
  try {
    const clients = await User.find({ role: "user" }).select("-password");
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Failed to load clients" });
  }
});

router.get("/clients/:clientId", protect, adminOnly, async (req, res) => {
  try {
    const client = await User.findById(req.params.clientId).select("-password");

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Failed to load client" });
  }
});

router.post("/assign-workout/:clientId", protect, adminOnly, async (req, res) => {
  try {
    const { bodyPart, title, description, sets, reps, videoUrl } = req.body;

    const client = await User.findById(req.params.clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    client.assignedWorkouts.push({
      bodyPart,
      title,
      description,
      sets,
      reps,
      videoUrl,
    });

    await client.save();

    res.json(client.assignedWorkouts);
  } catch (error) {
    res.status(500).json({ message: "Failed to assign workout" });
  }
});

router.post("/assign-diet/:clientId", protect, adminOnly, async (req, res) => {
  try {
    const { meal, food, calories, notes } = req.body;

    const client = await User.findById(req.params.clientId);

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    client.assignedDiet.push({
      meal,
      food,
      calories,
      notes,
    });

    await client.save();

    res.json(client.assignedDiet);
  } catch (error) {
    res.status(500).json({ message: "Failed to assign diet" });
  }
});

module.exports = router;