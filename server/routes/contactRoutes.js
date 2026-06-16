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

router.patch("/:id", protect, adminOnly, async (req, res) => {
  const { status } = req.body;

  if (!["open", "in-progress", "closed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const issue = await ContactIssue.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!issue) {
    return res.status(404).json({ message: "Issue not found" });
  }

  res.json(issue);
});

module.exports = router;