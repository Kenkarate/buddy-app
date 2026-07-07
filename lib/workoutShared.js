// Shared helpers for the admin workout builders (daily/weekly/home). Kept in a
// plain module (no React components) so importing them doesn't break fast-refresh.

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

export const bodyParts = [
  "Chest",
  "Back",
  "Shoulder",
  "Arms",
  "Legs",
  "Abs",
  "Full Body",
  "Cardio",
];

// Normalizes a raw exercise (from /exercises/search) into the shape the
// builders store on a plan.
export function mapExercise(exercise) {
  return {
    exerciseId: exercise.exerciseId || exercise._id,
    name: exercise.name,
    imageUrl: exercise.imageUrls?.[0] || exercise.imageUrl || FALLBACK_IMAGE,
    equipment: exercise.equipment || "bodyweight",
    primaryMuscles: exercise.primaryMuscles || [exercise.bodyPart].filter(Boolean),
    instructions: exercise.instructions || [],
    sets: exercise.level === "expert" ? 5 : exercise.level === "intermediate" ? 4 : 3,
    reps: exercise.level === "expert" ? "8" : exercise.level === "intermediate" ? "10" : "12",
    rest: 60,
    notes: "",
  };
}
