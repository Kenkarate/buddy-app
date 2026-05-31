const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name:normalizedEmail,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({
      token: createToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        selectedProgram: user.selectedProgram,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      token: createToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        selectedProgram: user.selectedProgram,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

router.put("/profile", protect, async (req, res) => {
  const { age, height, weight, goal } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      age,
      height,
      weight,
      goal,
    },
    { new: true }
  ).select("-password");

  res.json(user);
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      message: "If this email exists, a reset link will be generated.",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 15;

  await user.save();

  console.log("Password reset link:");
  console.log(`http://localhost:5173/reset-password/${resetToken}`);

  res.json({
    message: "Reset link generated. Check backend terminal.",
  });
});

router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset link" });
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ message: "Password updated successfully" });
});

module.exports = router;