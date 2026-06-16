const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { ok, AppError } = require("../utils/apiResponse");

const router = express.Router();

// Express 5 forwards async errors to the central handler in index.js, so these
// handlers throw AppError instead of try/catch and return the standard envelope.

router.get("/clients", protect, adminOnly, async (req, res) => {
  const clients = await User.find({ role: "user" }).select("-password");
  ok(res, clients);
});

router.get("/clients/:clientId", protect, adminOnly, async (req, res) => {
  const client = await User.findById(req.params.clientId).select("-password");

  if (!client) {
    throw new AppError("Client not found", 404, "NOT_FOUND");
  }

  ok(res, client);
});

router.post("/assign-workout/:clientId", protect, adminOnly, async (req, res) => {
  const { bodyPart, title, description, sets, reps, videoUrl } = req.body;

  const client = await User.findById(req.params.clientId);

  if (!client) {
    throw new AppError("Client not found", 404, "NOT_FOUND");
  }

  client.assignedWorkouts.push({ bodyPart, title, description, sets, reps, videoUrl });
  await client.save();

  ok(res, client.assignedWorkouts);
});

router.post("/assign-diet/:clientId", protect, adminOnly, async (req, res) => {
  const { meal, food, calories, notes } = req.body;

  const client = await User.findById(req.params.clientId);

  if (!client) {
    throw new AppError("Client not found", 404, "NOT_FOUND");
  }

  client.assignedDiet.push({ meal, food, calories, notes });
  await client.save();

  ok(res, client.assignedDiet);
});

module.exports = router;
