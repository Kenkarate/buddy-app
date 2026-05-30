const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.dietPlans);
});

router.post("/", protect, async (req, res) => {
  const { meal, food, calories } = req.body;

  const user = await User.findById(req.user.id);

  user.dietPlans.push({
    meal,
    food,
    calories,
  });

  await user.save();

  res.status(201).json(user.dietPlans);
});

module.exports = router;