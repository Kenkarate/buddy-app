const express = require("express");
const ContactIssue = require("../models/ContactIssue");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  const issue = await ContactIssue.create({
    userId: req.user.id,
    ...req.body,
  });

  res.status(201).json(issue);
});

router.get("/", protect, adminOnly, async (req, res) => {
  const issues = await ContactIssue.find().sort({ createdAt: -1 });
  res.json(issues);
});

module.exports = router;