import { Exercise } from "@/models/Exercise";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

export function escapeRegex(value: unknown): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeExercise(exercise: any) {
  const object =
    typeof exercise.toObject === "function" ? exercise.toObject() : exercise;
  const imageUrls =
    Array.isArray(object.imageUrls) && object.imageUrls.length
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

type ExerciseQuery = Record<string, string | undefined>;

export function buildFilter(query: ExerciseQuery) {
  const filter: Record<string, unknown> = { isActive: { $ne: false } };

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

  if (query.bodyPart)
    filter.bodyPart = new RegExp(`^${escapeRegex(query.bodyPart)}$`, "i");
  if (query.equipment)
    filter.equipment = new RegExp(`^${escapeRegex(query.equipment)}$`, "i");
  if (query.category)
    filter.category = new RegExp(`^${escapeRegex(query.category)}$`, "i");
  if (query.level) {
    const levels = String(query.level)
      .split(",")
      .map((item) => new RegExp(`^${escapeRegex(item.trim())}$`, "i"));
    filter.level = { $in: levels };
  }
  if (query.muscle) {
    const regex = new RegExp(`^${escapeRegex(query.muscle)}$`, "i");
    filter.$or = [
      { primaryMuscles: regex },
      { secondaryMuscles: regex },
      { musclesTrained: regex },
    ];
  }
  if (query.home === "true") {
    filter.level = { $in: [/^beginner$/i, /^intermediate$/i] };
  }

  return filter;
}

// Paginated, filtered exercise listing. Returns the response payload (the route
// handlers wrap it in NextResponse.json).
export async function listExercises(query: ExerciseQuery) {
  const limit = Math.min(Math.max(Number(query.limit) || 60, 1), 200);
  const page = Math.max(Number(query.page) || 1, 1);
  const skip = (page - 1) * limit;
  const filter = buildFilter(query);

  const [rows, total] = await Promise.all([
    Exercise.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Exercise.countDocuments(filter),
  ]);

  return {
    exercises: rows.map(normalizeExercise),
    total,
    page,
    limit,
  };
}

// Converts a URLSearchParams into the plain query object the helpers expect.
export function searchParamsToQuery(sp: URLSearchParams): ExerciseQuery {
  const out: ExerciseQuery = {};
  sp.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
