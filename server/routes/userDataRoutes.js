const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/workouts", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.assignedWorkouts);
});

router.get("/diet", protect, async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    dietWarningAccepted: user.dietWarningAccepted,
    diet: user.assignedDiet,
  });
});

router.post("/accept-diet-warning", protect, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { dietWarningAccepted: true },
    { new: true }
  ).select("-password");

  res.json(user);
});

router.get("/weight", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.weightRecords);
});

router.post("/weight", protect, async (req, res) => {
  const { weight } = req.body;

  const user = await User.findById(req.user.id);

  user.weightRecords.push({
    weight,
    date: new Date(),
  });

  user.weight = weight;

  await user.save();

  res.json(user.weightRecords);
});

router.get("/bmi", protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user.bmiRecords);
});

router.post("/bmi", protect, async (req, res) => {
  const { height, weight } = req.body;

  const heightInMeters = height / 100;
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1));

  let category = "Normal";

  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";

  const user = await User.findById(req.user.id);

  user.bmiRecords.push({
    height,
    weight,
    bmi,
    category,
  });

  await user.save();

  res.json({
    bmi,
    category,
    records: user.bmiRecords,
  });
});

module.exports = router;