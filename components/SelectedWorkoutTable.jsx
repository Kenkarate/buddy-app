"use client";

import { Trash2 } from "lucide-react";
import { FALLBACK_IMAGE } from "@/lib/workoutShared";

// Editable list of exercises chosen for a plan, shared by the daily/weekly/home
// workout builders. Each row lets the trainer tweak sets/reps/rest/notes.
function SelectedWorkoutTable({ bodyPart, exercises, onDelete, onUpdate }) {
  if (exercises.length === 0) {
    return <div className="admin-empty-box">No workouts added yet.</div>;
  }

  return (
    <div className="admin-selected-table">
      {exercises.map((exercise) => (
        <article key={exercise.exerciseId} className="admin-selected-row">
          <div className="admin-selected-row-head">
            <img src={exercise.imageUrl || FALLBACK_IMAGE} alt={exercise.name} />
            <div>
              <strong>{exercise.name}</strong>
              <span>{exercise.primaryMuscles?.join(", ") || bodyPart}</span>
            </div>
            <button type="button" onClick={() => onDelete(exercise.exerciseId)}>
              <Trash2 size={18} />
            </button>
          </div>

          <div className="admin-mini-fields">
            <label>
              <span>Sets</span>
              <input
                type="number"
                value={exercise.sets}
                onChange={(event) => onUpdate(exercise.exerciseId, "sets", Number(event.target.value))}
              />
            </label>
            <label>
              <span>Reps</span>
              <input
                value={exercise.reps}
                onChange={(event) => onUpdate(exercise.exerciseId, "reps", event.target.value)}
              />
            </label>
            <label>
              <span>Rest</span>
              <input
                type="number"
                value={exercise.rest}
                onChange={(event) => onUpdate(exercise.exerciseId, "rest", Number(event.target.value))}
              />
            </label>
          </div>

          <textarea
            value={exercise.notes}
            onChange={(event) => onUpdate(exercise.exerciseId, "notes", event.target.value)}
            placeholder="Trainer notes"
          />
        </article>
      ))}
    </div>
  );
}

export default SelectedWorkoutTable;
