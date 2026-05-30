const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const workoutDataRoutes = require("./routes/workoutDataRoutes");
const dietDataRoutes = require("./routes/dietDataRoutes");
const adminAssignmentRoutes = require("./routes/adminAssignmentRoutes");
const contactRoutes = require("./routes/contactRoutes");

const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const adminRoutes = require("./routes/adminRoutes");

const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Buddy API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/user", userDataRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/workout-data", workoutDataRoutes);
app.use("/api/diet-data", dietDataRoutes);
app.use("/api/admin-assignments", adminAssignmentRoutes);
app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });