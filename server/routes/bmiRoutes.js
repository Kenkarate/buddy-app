const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

router.get("/", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.bmiRecords);
});

router.post("/", protect, async (req, res) => {
  const { height, weight } = req.body;

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  const category = getBmiCategory(bmi);

  const user = await User.findById(req.user.id);

  user.bmiRecords.push({
    height,
    weight,
    bmi,
    category,
  });

  await user.save();

  res.status(201).json({
    bmi,
    category,
    records: user.bmiRecords,
  });
});

module.exports = router;