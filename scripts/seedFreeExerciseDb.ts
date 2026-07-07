import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Exercise } from "@/models/Exercise";

const DATASET_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

function inferBodyPart(exercise: any): string {
  const text = [
    ...(exercise.primaryMuscles || []),
    ...(exercise.secondaryMuscles || []),
    exercise.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/chest|pector/.test(text)) return "chest";
  if (/biceps/.test(text)) return "biceps";
  if (/triceps/.test(text)) return "triceps";
  if (/shoulder|delts|deltoid/.test(text)) return "shoulders";
  if (/lats|middle back|lower back|traps|neck/.test(text)) return "back";
  if (/quadriceps|hamstrings|calves|glutes|adductors|abductors/.test(text)) return "legs";
  if (/abdominals|core/.test(text)) return "abs";
  if (/cardio/.test(text)) return "cardio";
  if (/stretching/.test(text)) return "stretching";

  return exercise.primaryMuscles?.[0] || exercise.category || "other";
}

function defaultSets(level?: string): number {
  if (level === "expert") return 5;
  if (level === "intermediate") return 4;
  return 3;
}

function defaultReps(level?: string): number {
  if (level === "expert") return 8;
  if (level === "intermediate") return 10;
  return 12;
}

function normalize(exercise: any) {
  const images = Array.isArray(exercise.images) ? exercise.images : [];
  const imageUrls = images.map((imagePath: string) => `${IMAGE_BASE_URL}${imagePath}`);
  const bodyPart = inferBodyPart(exercise);

  return {
    exerciseId: exercise.id,
    name: exercise.name,
    force: exercise.force || null,
    level: exercise.level || "beginner",
    mechanic: exercise.mechanic || null,
    equipment: exercise.equipment || "bodyweight",
    primaryMuscles: exercise.primaryMuscles || [],
    secondaryMuscles: exercise.secondaryMuscles || [],
    instructions: exercise.instructions || [],
    category: exercise.category || null,
    images,
    imageUrls,
    bodyPart,
    targetMuscle: bodyPart,
    musclesTrained: exercise.primaryMuscles || [],
    imageUrl: imageUrls[0] || "",
    gifUrl: imageUrls[0] || "",
    beginnerCaption: exercise.instructions?.[0] || "",
    defaultSets: defaultSets(exercise.level),
    defaultReps: defaultReps(exercise.level),
    restSeconds: 60,
    difficulty:
      exercise.level === "expert" ? "advanced" : exercise.level || "beginner",
    isActive: true,
  };
}

async function seedExercises() {
  await connectDB();

  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch exercise dataset: ${response.status}`);
  }

  const rows = (await response.json()) as any[];
  const operations = rows.map((row) => {
    const exercise = normalize(row);
    return {
      updateOne: {
        filter: { exerciseId: exercise.exerciseId },
        update: { $set: exercise },
        upsert: true,
      },
    };
  });

  const result = await Exercise.bulkWrite(operations, { ordered: false });
  console.log(`Processed ${rows.length} exercises.`);
  console.log(`Inserted: ${result.upsertedCount}, matched: ${result.matchedCount}.`);

  await mongoose.disconnect();
}

seedExercises().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
