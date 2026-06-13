const express = require("express");
const User = require("../models/User");
const Exercise = require("../models/Exercise");
const DailyWorkoutPlan = require("../models/DailyWorkoutPlan");
const WeeklyWorkoutPlan = require("../models/WeeklyWorkoutPlan");
const WorkoutEvent = require("../models/WorkoutEvent");
const Payment = require("../models/Payment");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

function startOfWeek(dateKey) {
  const date = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function isSunday(dateKey) {
  if (!dateKey) return false;
  return new Date(`${dateKey}T00:00:00`).getDay() === 0;
}

function cleanExercise(exercise = {}) {
  return {
    exerciseId: exercise.exerciseId || exercise.workoutId || String(exercise._id || ""),
    name: exercise.name || exercise.workoutName || "Exercise",
    imageUrl:
      exercise.imageUrl ||
      exercise.image ||
      exercise.imageUrls?.[0] ||
      "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80",
    equipment: exercise.equipment || "bodyweight",
    primaryMuscles: exercise.primaryMuscles || [exercise.bodyPart].filter(Boolean),
    instructions: exercise.instructions || [],
    sets: Number(exercise.sets || 3),
    reps: String(exercise.reps || "12"),
    rest: Number(exercise.rest || exercise.restSeconds || 60),
    notes: exercise.notes || "",
  };
}

function cleanDailyPayload(body = {}, userId) {
  const exercises = Array.isArray(body.exercises) ? body.exercises.map(cleanExercise) : [];
  return {
    date: body.date,
    bodyPart: body.bodyPart || "Full Body",
    title: body.title || `${body.bodyPart || "Full Body"} Workout`,
    exercises,
    createdBy: userId,
  };
}

function cleanWeeklyPayload(body = {}, userId) {
  const weekSundayDate = body.weekSundayDate || body.weekStartDate;

  if (!isSunday(weekSundayDate)) {
    const error = new Error("Weekly workout can only be assigned on a Sunday date.");
    error.statusCode = 400;
    throw error;
  }

  const bodyPart = body.bodyPart || "Full Body";

  return {
    weekSundayDate,
    weekStartDate: addDays(weekSundayDate, 1),
    weekEndDate: addDays(weekSundayDate, 7),
    bodyPart,
    title: body.title || `${bodyPart} Weekly Workout`,
    exercises: Array.isArray(body.exercises) ? body.exercises.map(cleanExercise) : [],
    isActive: body.isActive !== false,
    createdBy: userId,
  };
}

async function logAdminEvent(req, workoutName) {
  try {
    await WorkoutEvent.create({
      userId: req.user.id,
      workoutId: "admin-assignment",
      exerciseId: "admin-assignment",
      workoutName,
      eventType: "checked",
      source: "daily",
    });
  } catch (error) {
    console.error("ADMIN EVENT LOG ERROR:", error);
  }
}

router.get("/analytics/summary", protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      paidUsers,
      freeUsers,
      newUsersThisWeek,
      totalWorkouts,
      dailyPlans,
      weeklyPlans,
      completedEvents,
      viewedEvents,
      payments,
      topCategory,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", subscriptionStatus: "paid" }),
      User.countDocuments({ role: "user", subscriptionStatus: { $ne: "paid" } }),
      User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
      Exercise.countDocuments({ isActive: { $ne: false } }),
      DailyWorkoutPlan.countDocuments(),
      WeeklyWorkoutPlan.countDocuments(),
      WorkoutEvent.countDocuments({ eventType: { $in: ["complete", "checked"] } }),
      WorkoutEvent.countDocuments({ eventType: "view" }),
      Payment.aggregate([
        { $match: { createdAt: { $gte: monthStart } } },
        { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]).catch(() => []),
      Exercise.aggregate([
        { $match: { isActive: { $ne: false }, bodyPart: { $nin: [null, ""] } } },
        { $group: { _id: "$bodyPart", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
    ]);

    res.json({
      totalUsers,
      activeUsers: viewedEvents + completedEvents,
      paidUsers,
      freeUsers,
      totalWorkouts,
      totalAssignedDailyWorkouts: dailyPlans,
      totalAssignedWeeklyWorkouts: weeklyPlans,
      workoutsCheckedByUsers: completedEvents,
      workoutViews: viewedEvents,
      mostUsedWorkoutCategory: topCategory[0]?._id || "Not available",
      newUsersThisWeek,
      paymentsThisMonth: payments[0]?.amount || 0,
      paymentsThisMonthCount: payments[0]?.count || 0,
    });
  } catch (error) {
    console.error("ADMIN ANALYTICS SUMMARY ERROR:", error);
    res.status(500).json({ message: "Failed to load analytics summary" });
  }
});

router.get("/analytics/recent-activity", protect, adminOnly, async (req, res) => {
  try {
    const [users, events, dailyPlans] = await Promise.all([
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(8).select("name email createdAt"),
      WorkoutEvent.find().sort({ createdAt: -1 }).limit(12).populate("userId", "name email"),
      DailyWorkoutPlan.find().sort({ updatedAt: -1 }).limit(6).select("title date bodyPart updatedAt"),
    ]);

    const activity = [
      ...users.map((user) => ({
        id: String(user._id),
        type: "user_registered",
        title: `${user.name || user.email} registered`,
        detail: user.email,
        createdAt: user.createdAt,
      })),
      ...events.map((event) => ({
        id: String(event._id),
        type: `workout_${event.eventType}`,
        title: `${event.userId?.name || event.userId?.email || "User"} ${event.eventType} ${event.workoutName}`,
        detail: event.source,
        createdAt: event.createdAt,
      })),
      ...dailyPlans.map((plan) => ({
        id: String(plan._id),
        type: "admin_assigned_workout",
        title: `Admin assigned ${plan.title}`,
        detail: plan.date,
        createdAt: plan.updatedAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 15);

    res.json({ activity });
  } catch (error) {
    console.error("ADMIN RECENT ACTIVITY ERROR:", error);
    res.status(500).json({ message: "Failed to load recent activity" });
  }
});

router.get("/analytics/top-workouts", protect, adminOnly, async (req, res) => {
  try {
    const rows = await WorkoutEvent.aggregate([
      { $group: { _id: "$workoutName", views: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } }, completions: { $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] } } } },
      { $sort: { views: -1, completions: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      workouts: rows.map((row) => ({
        name: row._id,
        views: row.views,
        completions: row.completions,
      })),
    });
  } catch (error) {
    console.error("ADMIN TOP WORKOUTS ERROR:", error);
    res.status(500).json({ message: "Failed to load top workouts" });
  }
});

router.get("/daily-workout", protect, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || toDateKey();
    const plan = await DailyWorkoutPlan.findOne({ date });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to load daily workout" });
  }
});

router.get("/daily-workouts", protect, adminOnly, async (req, res) => {
  try {
    const month = req.query.month || toDateKey().slice(0, 7);
    const plans = await DailyWorkoutPlan.find({
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: "Failed to load daily workouts" });
  }
});

router.post("/daily-workout", protect, adminOnly, async (req, res) => {
  try {
    const payload = cleanDailyPayload(req.body, req.user.id);
    const plan = await DailyWorkoutPlan.findOneAndUpdate(
      { date: payload.date },
      payload,
      { upsert: true, new: true, runValidators: true }
    );
    await logAdminEvent(req, plan.title);
    res.status(201).json(plan);
  } catch (error) {
    console.error("SAVE DAILY WORKOUT ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to save daily workout" });
  }
});

router.put("/daily-workout/:id", protect, adminOnly, async (req, res) => {
  try {
    const payload = cleanDailyPayload(req.body, req.user.id);
    const plan = await DailyWorkoutPlan.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to update daily workout" });
  }
});

router.delete("/daily-workout/:id", protect, adminOnly, async (req, res) => {
  try {
    await DailyWorkoutPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete daily workout" });
  }
});

router.get("/weekly-workout", protect, adminOnly, async (req, res) => {
  try {
    const weekSundayDate = req.query.weekSundayDate || req.query.weekStartDate;

    if (!weekSundayDate || !isSunday(weekSundayDate)) {
      return res.status(400).json({
        message: "Select a Sunday date to load a weekly workout.",
      });
    }

    const plan = await WeeklyWorkoutPlan.findOne({ weekSundayDate });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to load weekly workout" });
  }
});

router.get("/weekly-workouts", protect, adminOnly, async (req, res) => {
  try {
    const month = req.query.month || toDateKey().slice(0, 7);
    const plans = await WeeklyWorkoutPlan.find({
      weekSundayDate: { $regex: `^${month}` },
    }).sort({ weekSundayDate: 1 });

    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: "Failed to load weekly workouts" });
  }
});

router.post("/weekly-workout", protect, adminOnly, async (req, res) => {
  try {
    const payload = cleanWeeklyPayload(req.body, req.user.id);
    const plan = await WeeklyWorkoutPlan.findOneAndUpdate(
      {
        $or: [
          { weekSundayDate: payload.weekSundayDate },
          { weekStartDate: payload.weekStartDate },
        ],
      },
      payload,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(plan);
  } catch (error) {
    console.error("SAVE WEEKLY WORKOUT ERROR:", error);
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to save weekly workout",
    });
  }
});

router.put("/weekly-workout/:id", protect, adminOnly, async (req, res) => {
  try {
    const payload = cleanWeeklyPayload(req.body, req.user.id);
    const plan = await WeeklyWorkoutPlan.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });
    res.json(plan);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Failed to update weekly workout",
    });
  }
});

router.delete("/weekly-workout/:id", protect, adminOnly, async (req, res) => {
  try {
    await WeeklyWorkoutPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete weekly workout" });
  }
});

router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const filter = { role: "user" };
    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(60)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    const userIds = users.map((user) => user._id);
    const events = await WorkoutEvent.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", viewed: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } }, completed: { $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] } }, lastActive: { $max: "$createdAt" } } },
    ]);
    const eventMap = new Map(events.map((row) => [String(row._id), row]));

    res.json({
      users: users.map((user) => {
        const stats = eventMap.get(String(user._id)) || {};
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          subscriptionStatus: user.subscriptionStatus,
          selectedProgram: user.selectedProgram,
          selectedPlan: user.selectedPlan,
          purchasedPlans: user.purchasedPlans || [],
          joinedDate: user.createdAt,
          workoutsViewed: stats.viewed || 0,
          workoutsCompleted: stats.completed || 0,
          lastActiveDate: stats.lastActive || user.updatedAt,
          bmiRecords: user.bmiRecords || [],
        };
      }),
    });
  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

router.get("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const [user, events] = await Promise.all([
      User.findById(req.params.id).select("-password -resetPasswordToken -resetPasswordExpires"),
      WorkoutEvent.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(40),
    ]);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user, events });
  } catch (error) {
    res.status(500).json({ message: "Failed to load user" });
  }
});

module.exports = router;
