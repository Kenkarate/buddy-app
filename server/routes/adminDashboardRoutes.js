const express = require("express");
const User = require("../models/User");
const Exercise = require("../models/Exercise");
const DailyWorkoutPlan = require("../models/DailyWorkoutPlan");
const WeeklyWorkoutPlan = require("../models/WeeklyWorkoutPlan");
const WorkoutEvent = require("../models/WorkoutEvent");
const Payment = require("../models/Payment");
const ContactIssue = require("../models/ContactIssue");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { ok, AppError } = require("../utils/apiResponse");
const { requireEnum, requireNumber } = require("../utils/adminValidation");
const {
  PLAN_KEYS,
  grantPlan,
  extendPlan,
  revokePlan,
  recordPayment,
} = require("../utils/planManagement");

const router = express.Router();

const SAFE_USER_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

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
    throw new AppError("Weekly workout can only be assigned on a Sunday date.", 400, "BAD_REQUEST");
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
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // A purchase that currently grants access: paid and not yet expired.
  const activePurchaseMatch = {
    paymentStatus: "paid",
    $or: [{ planExpiryDate: { $exists: false } }, { planExpiryDate: { $gt: now } }],
  };

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
    revenueByPlanRows,
    activeSubscribers,
    expiringSoon,
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
      { $match: { status: "paid", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).catch(() => []),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$planKey", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]).catch(() => []),
    User.countDocuments({ role: "user", purchasedPlans: { $elemMatch: activePurchaseMatch } }),
    User.countDocuments({
      role: "user",
      purchasedPlans: {
        $elemMatch: { paymentStatus: "paid", planExpiryDate: { $gt: now, $lte: weekAhead } },
      },
    }),
    Exercise.aggregate([
      { $match: { isActive: { $ne: false }, bodyPart: { $nin: [null, ""] } } },
      { $group: { _id: "$bodyPart", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const totalRevenue = revenueByPlanRows.reduce((sum, row) => sum + (row.amount || 0), 0);

  ok(res, {
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
    // Real-data subscription metrics
    activeSubscribers,
    expiringSoon,
    conversionRate: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0,
    totalRevenue,
    revenueByPlan: revenueByPlanRows.map((row) => ({
      plan: row._id || "unknown",
      amount: row.amount || 0,
      count: row.count || 0,
    })),
  });
});

// Users whose active plan expires within the next N days (default 7) — the
// admin's "reach out / renew" list.
router.get("/analytics/expiring", protect, adminOnly, async (req, res) => {
  const now = new Date();
  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 7));
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + days);

  const users = await User.find({
    role: "user",
    purchasedPlans: {
      $elemMatch: { paymentStatus: "paid", planExpiryDate: { $gt: now, $lte: horizon } },
    },
  })
    .select("name email purchasedPlans")
    .limit(100);

  const expiring = [];
  for (const user of users) {
    for (const purchase of user.purchasedPlans || []) {
      const expiry = purchase.planExpiryDate ? new Date(purchase.planExpiryDate) : null;
      if (purchase.paymentStatus === "paid" && expiry && expiry > now && expiry <= horizon) {
        expiring.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          plan: purchase.plan,
          planExpiryDate: purchase.planExpiryDate,
        });
      }
    }
  }

  expiring.sort((a, b) => new Date(a.planExpiryDate) - new Date(b.planExpiryDate));

  ok(res, { expiring }, { days });
});

router.get("/analytics/recent-activity", protect, adminOnly, async (req, res) => {
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

  ok(res, { activity });
});

router.get("/analytics/top-workouts", protect, adminOnly, async (req, res) => {
  const rows = await WorkoutEvent.aggregate([
    { $group: { _id: "$workoutName", views: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } }, completions: { $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] } } } },
    { $sort: { views: -1, completions: -1 } },
    { $limit: 10 },
  ]);

  ok(res, {
    workouts: rows.map((row) => ({
      name: row._id,
      views: row.views,
      completions: row.completions,
    })),
  });
});

router.get("/daily-workout", protect, adminOnly, async (req, res) => {
  const date = req.query.date || toDateKey();
  const plan = await DailyWorkoutPlan.findOne({ date });
  ok(res, plan);
});

router.get("/daily-workouts", protect, adminOnly, async (req, res) => {
  const month = req.query.month || toDateKey().slice(0, 7);
  const plans = await DailyWorkoutPlan.find({
    date: { $regex: `^${month}` },
  }).sort({ date: 1 });

  ok(res, { plans });
});

router.post("/daily-workout", protect, adminOnly, async (req, res) => {
  const payload = cleanDailyPayload(req.body, req.user.id);
  const plan = await DailyWorkoutPlan.findOneAndUpdate(
    { date: payload.date },
    payload,
    { upsert: true, new: true, runValidators: true }
  );
  await logAdminEvent(req, plan.title);
  ok(res.status(201), plan);
});

router.put("/daily-workout/:id", protect, adminOnly, async (req, res) => {
  const payload = cleanDailyPayload(req.body, req.user.id);
  const plan = await DailyWorkoutPlan.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  ok(res, plan);
});

router.delete("/daily-workout/:id", protect, adminOnly, async (req, res) => {
  await DailyWorkoutPlan.findByIdAndDelete(req.params.id);
  ok(res, { success: true });
});

router.get("/weekly-workout", protect, adminOnly, async (req, res) => {
  const weekSundayDate = req.query.weekSundayDate || req.query.weekStartDate;

  if (!weekSundayDate || !isSunday(weekSundayDate)) {
    throw new AppError("Select a Sunday date to load a weekly workout.", 400, "BAD_REQUEST");
  }

  const plan = await WeeklyWorkoutPlan.findOne({ weekSundayDate });
  ok(res, plan);
});

router.get("/weekly-workouts", protect, adminOnly, async (req, res) => {
  const month = req.query.month || toDateKey().slice(0, 7);
  const plans = await WeeklyWorkoutPlan.find({
    weekSundayDate: { $regex: `^${month}` },
  }).sort({ weekSundayDate: 1 });

  ok(res, { plans });
});

router.post("/weekly-workout", protect, adminOnly, async (req, res) => {
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

  ok(res.status(201), plan);
});

router.put("/weekly-workout/:id", protect, adminOnly, async (req, res) => {
  const payload = cleanWeeklyPayload(req.body, req.user.id);
  const plan = await WeeklyWorkoutPlan.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  ok(res, plan);
});

router.delete("/weekly-workout/:id", protect, adminOnly, async (req, res) => {
  await WeeklyWorkoutPlan.findByIdAndDelete(req.params.id);
  ok(res, { success: true });
});

router.get("/users", protect, adminOnly, async (req, res) => {
  const query = String(req.query.q || "").trim();
  const filter = { role: "user" };
  if (query) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (req.query.subscriptionStatus) {
    filter.subscriptionStatus = req.query.subscriptionStatus;
  }

  if (req.query.selectedPlan !== undefined) {
    filter.selectedPlan = req.query.selectedPlan;
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password -resetPasswordToken -resetPasswordExpires"),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((user) => user._id);
  const events = await WorkoutEvent.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", viewed: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } }, completed: { $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] } }, lastActive: { $max: "$createdAt" } } },
  ]);
  const eventMap = new Map(events.map((row) => [String(row._id), row]));

  ok(
    res,
    users.map((user) => {
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
    {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  );
});

router.get("/users/:id", protect, adminOnly, async (req, res) => {
  const [user, events, payments, tickets] = await Promise.all([
    User.findById(req.params.id).select(SAFE_USER_FIELDS),
    WorkoutEvent.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(40),
    Payment.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(40),
    ContactIssue.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(20),
  ]);

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  ok(res, { user, events, payments, tickets });
});

router.patch("/users/:id", protect, adminOnly, async (req, res) => {
  const updates = {};

  if (req.body.subscriptionStatus !== undefined) {
    if (!["none", "trial", "paid", "expired"].includes(req.body.subscriptionStatus)) {
      throw new AppError("Invalid subscription status", 422, "VALIDATION_ERROR");
    }
    updates.subscriptionStatus = req.body.subscriptionStatus;
  }

  if (req.body.selectedPlan !== undefined) {
    if (!["personal-training", "normal-workouts", "home-workout", ""].includes(req.body.selectedPlan)) {
      throw new AppError("Invalid plan", 422, "VALIDATION_ERROR");
    }
    updates.selectedPlan = req.body.selectedPlan;
    updates.selectedProgram = req.body.selectedPlan;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields to update", 422, "VALIDATION_ERROR");
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
    "-password -resetPasswordToken -resetPasswordExpires"
  );

  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  ok(res, { user });
});

router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  if (String(req.user.id) === String(req.params.id)) {
    throw new AppError("You cannot delete your own account", 400, "BAD_REQUEST");
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.role === "admin") {
    throw new AppError("Cannot delete an admin account", 400, "BAD_REQUEST");
  }

  await User.findByIdAndDelete(req.params.id);
  await WorkoutEvent.deleteMany({ userId: req.params.id });

  ok(res, { success: true });
});

// --- Plan management: grant / extend / revoke a real, access-controlling plan ---

router.post("/users/:id/grant-plan", protect, adminOnly, async (req, res) => {
  const plan = requireEnum(req.body.plan, "plan", PLAN_KEYS);
  const durationMonths = requireNumber(req.body.durationMonths ?? 1, "durationMonths", {
    min: 1,
    max: 60,
    integer: true,
  });
  const amount = req.body.amount === undefined ? 0 : requireNumber(req.body.amount, "amount", { min: 0 });
  const currency = req.body.currency ? String(req.body.currency).toUpperCase() : "INR";

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  grantPlan(user, { plan, durationMonths, amount, currency });
  await user.save();

  await recordPayment({
    userId: user._id,
    plan,
    amount,
    currency,
    source: amount > 0 ? "admin" : "admin-comp",
  });

  const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
  ok(res, { user: fresh });
});

router.post("/users/:id/extend-plan", protect, adminOnly, async (req, res) => {
  const plan = requireEnum(req.body.plan, "plan", PLAN_KEYS);
  const addMonths = requireNumber(req.body.addMonths ?? 1, "addMonths", {
    min: 1,
    max: 60,
    integer: true,
  });

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  const newExpiry = extendPlan(user, { plan, addMonths });
  if (!newExpiry) {
    throw new AppError("User has no purchase for that plan to extend", 400, "NO_PURCHASE");
  }

  await user.save();

  const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
  ok(res, { user: fresh });
});

router.post("/users/:id/revoke-plan", protect, adminOnly, async (req, res) => {
  const plan = requireEnum(req.body.plan, "plan", PLAN_KEYS);

  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

  revokePlan(user, { plan });
  await user.save();

  const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
  ok(res, { user: fresh });
});

module.exports = router;
