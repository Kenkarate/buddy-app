const express = require("express");
const Exercise = require("../models/Exercise");

const router = express.Router();

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeExercise(exercise) {
  const object = typeof exercise.toObject === "function" ? exercise.toObject() : exercise;
  const imageUrls = Array.isArray(object.imageUrls) && object.imageUrls.length
    ? object.imageUrls
    : [object.imageUrl || object.gifUrl || FALLBACK_IMAGE];

  return {
    ...object,
    id: object._id,
    exerciseId: object.exerciseId || String(object._id),
    bodyPart: object.bodyPart || object.targetMuscle || "other",
    primaryMuscles: object.primaryMuscles?.length
      ? object.primaryMuscles
      : object.musclesTrained || [object.targetMuscle].filter(Boolean),
    secondaryMuscles: object.secondaryMuscles || [],
    instructions: object.instructions?.length
      ? object.instructions
      : [object.beginnerCaption].filter(Boolean),
    imageUrls,
    imageUrl: imageUrls[0],
    level: object.level || object.difficulty || "beginner",
    equipment: object.equipment || "bodyweight",
  };
}

function buildFilter(query) {
  const filter = { isActive: { $ne: false } };

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [
      { name: regex },
      { equipment: regex },
      { category: regex },
      { bodyPart: regex },
      { targetMuscle: regex },
      { primaryMuscles: regex },
      { secondaryMuscles: regex },
      { musclesTrained: regex },
    ];
  }

  if (query.bodyPart) filter.bodyPart = new RegExp(`^${escapeRegex(query.bodyPart)}$`, "i");
  if (query.equipment) filter.equipment = new RegExp(`^${escapeRegex(query.equipment)}$`, "i");
  if (query.category) filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  if (query.level) {
    const levels = String(query.level).split(",").map((item) => new RegExp(`^${escapeRegex(item.trim())}$`, "i"));
    filter.level = { $in: levels };
  }
  if (query.muscle) {
    const regex = new RegExp(`^${escapeRegex(query.muscle)}$`, "i");
    filter.$or = [{ primaryMuscles: regex }, { secondaryMuscles: regex }, { musclesTrained: regex }];
  }
  if (query.home === "true") {
    filter.level = { $in: [/^beginner$/i, /^intermediate$/i] };
  }

  return filter;
}

async function listExercises(req, res, overrides = {}) {
  try {
    const requestQuery = { ...req.query, ...overrides };
    const limit = Math.min(Math.max(Number(requestQuery.limit) || 60, 1), 200);
    const page = Math.max(Number(requestQuery.page) || 1, 1);
    const skip = (page - 1) * limit;
    const filter = buildFilter(requestQuery);

    const [rows, total] = await Promise.all([
      Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Exercise.countDocuments(filter),
    ]);

    res.json({
      exercises: rows.map(normalizeExercise),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("LIST EXERCISES ERROR:", error);
    res.status(500).json({ message: "Failed to load exercises" });
  }
}

router.get("/", listExercises);
router.get("/search", listExercises);

router.get("/filters", async (req, res) => {
  try {
    const [equipment, category, level, primaryMuscles, bodyParts] = await Promise.all([
      Exercise.distinct("equipment"),
      Exercise.distinct("category"),
      Exercise.distinct("level"),
      Exercise.distinct("primaryMuscles"),
      Exercise.distinct("bodyPart"),
    ]);

    const clean = (values) =>
      values
        .flat()
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim())
        .sort((a, b) => a.localeCompare(b));

    res.json({
      equipment: clean(equipment),
      category: clean(category),
      level: clean(level),
      primaryMuscles: clean(primaryMuscles),
      bodyParts: clean(bodyParts),
    });
  } catch (error) {
    console.error("EXERCISE FILTERS ERROR:", error);
    res.status(500).json({ message: "Failed to load exercise filters" });
  }
});

router.get("/home-plan", async (req, res) => {
  try {
    const rows = await Exercise.find({
      isActive: { $ne: false },
      level: { $in: [/^beginner$/i, /^intermediate$/i] },
    })
      .sort({ bodyPart: 1, name: 1 })
      .limit(150);

    const exercises = rows.map(normalizeExercise);
    const days = Array.from({ length: 30 }, (_, index) => ({
      day: index + 1,
      exercises: exercises.slice(index * 5, index * 5 + 5),
    }));

    res.json({ days });
  } catch (error) {
    console.error("HOME PLAN ERROR:", error);
    res.status(500).json({ message: "Failed to load home workout plan" });
  }
});

router.get("/bodypart/:bodyPart", (req, res) => {
  return listExercises(req, res, { bodyPart: req.params.bodyPart });
});

router.get("/equipment/:equipment", (req, res) => {
  return listExercises(req, res, { equipment: req.params.equipment });
});

router.get("/muscle/:muscle", (req, res) => {
  return listExercises(req, res, { muscle: req.params.muscle });
});

router.get("/category/:category", (req, res) => {
  return listExercises(req, res, { category: req.params.category });
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = id.match(/^[a-f\d]{24}$/i)
      ? { $or: [{ _id: id }, { exerciseId: id }] }
      : { exerciseId: id };
    const exercise = await Exercise.findOne(query);

    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found" });
    }

    res.json(normalizeExercise(exercise));
  } catch (error) {
    console.error("GET EXERCISE ERROR:", error);
    res.status(500).json({ message: "Failed to load exercise" });
  }
});

module.exports = router;
