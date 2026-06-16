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
const homeWorkoutRoutes = require("./routes/homeWorkoutRoutes");
const adminHomeWorkoutRoutes = require("./routes/adminHomeWorkoutRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const adminPricingRoutes = require("./routes/adminPricingRoutes");

const { parseBodyMiddleware } = require("./utils/parseBody");
const { AppError } = require("./utils/apiResponse");

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

// Razorpay subscription webhook MUST receive the raw body so its HMAC signature
// can be verified — register it before the JSON/body parsers below.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "*/*" }),
  require("./routes/razorpayWebhook")
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Normalize serverless Buffer/string bodies into plain objects (shared helper).
app.use(parseBodyMiddleware);

app.get("/", (req, res) => {
  res.send("Buddy API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/user", userDataRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/normal-workout-schedules", normalWorkoutScheduleRoutes);
app.use("/api/home-workout", homeWorkoutRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/workout-events", workoutEventRoutes);
app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/weekly-workout", weeklyWorkoutRoutes);

app.use("/api/workout-data", workoutDataRoutes);
app.use("/api/diet-data", dietDataRoutes);
app.use("/api/contact", contactRoutes);

// Admin namespace. adminDashboardRoutes + adminRoutes share /api/admin (their
// paths don't overlap); pricing and assignments are grouped here too.
app.use("/api/admin/pricing", adminPricingRoutes);
app.use("/api/admin", adminHomeWorkoutRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-assignments", adminAssignmentRoutes);

// Central error handler. Routes (esp. admin) throw AppError; everything funnels
// here into a consistent { error: { message, code, details } } envelope.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : err.statusCode || err.status || 500;

  if (!isAppError && statusCode >= 500) {
    console.error("UNHANDLED ERROR:", err);
  }

  const error = {
    message: isAppError || statusCode < 500 ? err.message : "Something went wrong",
    code: err.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "ERROR"),
  };

  if (err.details !== undefined) error.details = err.details;

  res.status(statusCode).json({ error });
});

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
