const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const workoutDataRoutes = require("./routes/workoutDataRoutes");
const exerciseRoutes = require("./routes/exerciseRoutes");
const dietDataRoutes = require("./routes/dietDataRoutes");
const adminAssignmentRoutes = require("./routes/adminAssignmentRoutes");
const contactRoutes = require("./routes/contactRoutes");

const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const userDataRoutes = require("./routes/userDataRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const workoutEventRoutes = require("./routes/workoutEventRoutes");
const workoutPlanRoutes = require("./routes/workoutPlanRoutes");
const weeklyWorkoutRoutes = require("./routes/weeklyWorkoutRoutes").router;

const normalWorkoutScheduleRoutes = require("./routes/normalWorkoutScheduleRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
];

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.body?.type === "Buffer" && Array.isArray(req.body.data)) {
    try {
      req.body = JSON.parse(Buffer.from(req.body.data).toString("utf8"));
    } catch (error) {
      console.error("Failed to parse buffer body:", error);
    }
  }

  next();
});
app.get("/", (req, res) => {
  res.send("Buddy API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/user", userDataRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/normal-workout-schedules", normalWorkoutScheduleRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workout-events", workoutEventRoutes);
app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/weekly-workout", weeklyWorkoutRoutes);

app.use("/api/workout-data", workoutDataRoutes);
app.use("/api/diet-data", dietDataRoutes);
app.use("/api/admin-assignments", adminAssignmentRoutes);
app.use("/api/contact", contactRoutes);

const PORT = process.env.PORT || 5001;

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGODB_URI);

  isConnected = true;
  console.log("MongoDB connected");
}

module.exports = { app, connectDB };

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(process.env.PORT || 5001, () => {
        console.log(`Server running on port ${process.env.PORT || 5001}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
    });
}
