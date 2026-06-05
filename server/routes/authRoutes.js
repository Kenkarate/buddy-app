const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function parseRequestBody(body) {
  if (!body) return {};

  if (body.email && body.password) {
    return body;
  }

  if (body.type === "Buffer" && Array.isArray(body.data)) {
    const jsonString = Buffer.from(body.data).toString("utf8");
    return JSON.parse(jsonString);
  }

  if (Buffer.isBuffer(body)) {
    const jsonString = body.toString("utf8");
    return JSON.parse(jsonString);
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

router.post("/register", async (req, res) => {
  try {
const parsedBody = parseRequestBody(req.body);

const { name, email, password } = parsedBody; 
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
    console.log("LOGIN BODY:", req.body);

const parsedBody = parseRequestBody(req.body);

const email = parsedBody?.email;
const password = parsedBody?.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
        receivedBody: req.body,
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Server JWT secret is missing" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("User not found:", normalizedEmail);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      console.log("Password mismatch for:", normalizedEmail);
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
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: error.message || "Login failed" });
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
  try {
    let body = req.body;

    if (body?.type === "Buffer" && Array.isArray(body.data)) {
      body = JSON.parse(Buffer.from(body.data).toString("utf8"));
    }

    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "https://curious-vacherin-a5e583.netlify.app";

    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    res.json({
      message: "Password reset link created. This link expires in 15 minutes.",
      resetLink,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message || "Forgot password failed" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    let body = req.body;

    if (body?.type === "Buffer" && Array.isArray(body.data)) {
      body = JSON.parse(Buffer.from(body.data).toString("utf8"));
    }

    const { token } = req.params;
    const { password } = body;

    if (!password) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or expired",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: error.message || "Reset password failed" });
  }
});

router.post("/google", async (req, res) => {
  try {
    const parsedBody = parseRequestBody(req.body);
    const { credential } = parsedBody;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google Client ID missing" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email?.trim().toLowerCase();
    const name = payload.name || email;
    const avatarUrl = payload.picture || "";

    if (!email) {
      return res.status(400).json({ message: "Google email missing" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: `google-${googleId}`,
        role: "user",
        googleId,
        avatarUrl,
        authProvider: "google",
      });
    } else {
      user.googleId = user.googleId || googleId;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.authProvider = user.authProvider || "email";
      await user.save();
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
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    res.status(500).json({ message: "Google login failed" });
  }
});

module.exports = router;