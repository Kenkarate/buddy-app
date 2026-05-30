const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.workouts);
});

router.post("/", protect, async (req, res) => {
  const { title, description, day } = req.body;

  const user = await User.findById(req.user.id);

  user.workouts.push({
    title,
    description,
    day,
  });

  await user.save();

  res.status(201).json(user.workouts);
});

module.exports = router;