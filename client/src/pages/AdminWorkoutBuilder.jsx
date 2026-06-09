import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

const bodyParts = ["Chest", "Back", "Shoulder", "Arms", "Legs", "Abs", "Full Body", "Cardio"];
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function emptyWeeklyPlan(weekStartDate) {
  return {
    weekStartDate,
    days: dayNames.map((dayName, index) => ({
      dayName,
      date: addDays(weekStartDate, index),
      bodyPart: "",
      title: "",
      exercises: [],
    })),
  };
}

function mapExercise(exercise) {
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

function AdminWorkoutBuilder({ mode }) {
  const isWeekly = mode === "weekly";
  const today = toDateKey();

  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek());
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(emptyWeeklyPlan(startOfWeek()));
  const [bodyPart, setBodyPart] = useState("Chest");
  const [search, setSearch] = useState("");
  const [exerciseRows, setExerciseRows] = useState([]);
  const [candidateExerciseId, setCandidateExerciseId] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeWeeklyDay = weeklyPlan.days?.[selectedDayIndex];
  const activeDate = isWeekly ? activeWeeklyDay?.date : selectedDate;
  const currentPlanId = isWeekly ? weeklyPlan?._id : dailyPlan?._id;
  const selectedCandidate = exerciseRows.find((exercise) => exercise.exerciseId === candidateExerciseId);

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map((exercise) => exercise.exerciseId)),
    [selectedExercises]
  );

  useEffect(() => {
    async function loadDaily() {
      if (isWeekly) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/admin/daily-workout?date=${selectedDate}`);
        setDailyPlan(res.data);
        setBodyPart(res.data?.bodyPart || "Chest");
        setSelectedExercises(res.data?.exercises || []);
      } catch (loadError) {
        console.error("Daily workout load error:", loadError);
        setError("Could not load this date.");
      } finally {
        setLoading(false);
      }
    }

    loadDaily();
  }, [isWeekly, selectedDate]);

  useEffect(() => {
    async function loadWeekly() {
      if (!isWeekly) return;
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/admin/weekly-workout?weekStartDate=${weekStartDate}`);
        const plan = res.data || emptyWeeklyPlan(weekStartDate);
        setWeeklyPlan(plan);
        const day = plan.days?.[selectedDayIndex] || plan.days?.[0];
        setBodyPart(day?.bodyPart || "Chest");
        setSelectedExercises(day?.exercises || []);
      } catch (loadError) {
        console.error("Weekly workout load error:", loadError);
        setError("Could not load this week.");
      } finally {
        setLoading(false);
      }
    }

    loadWeekly();
  }, [isWeekly, weekStartDate]);

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        setExerciseLoading(true);
        const q = search.trim() || bodyPart;
        const params = new URLSearchParams({ limit: "80", q });

        if (!["Arms", "Full Body", "Cardio", "Shoulder"].includes(bodyPart)) {
          params.set("bodyPart", bodyPart.toLowerCase());
        }
        if (bodyPart === "Shoulder") params.set("q", "shoulder");

        const res = await api.get(`/exercises/search?${params.toString()}`);
        if (!cancelled) {
          const rows = (res.data.exercises || []).map(mapExercise);
          setExerciseRows(rows);
          setCandidateExerciseId((current) =>
            rows.some((row) => row.exerciseId === current) ? current : rows[0]?.exerciseId || ""
          );
        }
      } catch (loadError) {
        console.error("Exercise load error:", loadError);
        if (!cancelled) setExerciseRows([]);
      } finally {
        if (!cancelled) setExerciseLoading(false);
      }
    }

    loadExercises();
    return () => {
      cancelled = true;
    };
  }, [bodyPart, search]);

  const chooseWeeklyDay = (index) => {
    const day = weeklyPlan.days[index];
    setSelectedDayIndex(index);
    setBodyPart(day?.bodyPart || "Chest");
    setSelectedExercises(day?.exercises || []);
    setSuccess("");
  };

  const addCandidateExercise = () => {
    if (!selectedCandidate) {
      setError("Select a workout first.");
      return;
    }

    setError("");

    if (selectedIds.has(selectedCandidate.exerciseId)) {
      setError("This workout is already in the selected list.");
      return;
    }

    setSelectedExercises((prev) => [...prev, selectedCandidate]);
  };

  const deleteSelectedExercise = (exerciseId) => {
    setSelectedExercises((prev) => prev.filter((exercise) => exercise.exerciseId !== exerciseId));
  };

  const updateSelectedExercise = (exerciseId, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((exercise) =>
        exercise.exerciseId === exerciseId ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const canGoNext = () => {
    if (step === 0) return Boolean(activeDate);
    if (step === 1) return selectedExercises.length > 0;
    return true;
  };

  const goNext = () => {
    if (!canGoNext()) {
      setError(step === 1 ? "Add at least one workout before continuing." : "Select a date first.");
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const goBack = () => {
    setError("");
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const savePlan = async () => {
    if (selectedExercises.length === 0) {
      setError("Select at least one exercise.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (isWeekly) {
        const nextPlan = {
          ...weeklyPlan,
          weekStartDate,
          days: weeklyPlan.days.map((day, index) =>
            index === selectedDayIndex
              ? {
                  ...day,
                  bodyPart,
                  title: `${bodyPart} Workout`,
                  exercises: selectedExercises,
                }
              : day
          ),
        };
        const res = currentPlanId
          ? await api.put(`/admin/weekly-workout/${currentPlanId}`, nextPlan)
          : await api.post("/admin/weekly-workout", nextPlan);
        setWeeklyPlan(res.data);
        setSuccess("Weekly workout saved.");
        return;
      }

      const payload = {
        date: selectedDate,
        bodyPart,
        title: `${bodyPart} Workout`,
        exercises: selectedExercises,
      };
      const res = currentPlanId
        ? await api.put(`/admin/daily-workout/${currentPlanId}`, payload)
        : await api.post("/admin/daily-workout", payload);
      setDailyPlan(res.data);
      setSuccess(currentPlanId ? "Daily workout updated." : "Daily workout saved.");
    } catch (saveError) {
      console.error("Workout save error:", saveError);
      setError(saveError.response?.data?.message || "Could not save workout.");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!currentPlanId) {
      setSelectedExercises([]);
      return;
    }

    const confirmed = window.confirm("Delete this assigned workout?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      if (isWeekly) {
        const nextPlan = {
          ...weeklyPlan,
          days: weeklyPlan.days.map((day, index) =>
            index === selectedDayIndex
              ? { ...day, bodyPart: "", title: "", exercises: [] }
              : day
          ),
        };
        const res = await api.put(`/admin/weekly-workout/${currentPlanId}`, nextPlan);
        setWeeklyPlan(res.data);
        setSelectedExercises([]);
      } else {
        await api.delete(`/admin/daily-workout/${currentPlanId}`);
        setDailyPlan(null);
        setSelectedExercises([]);
      }
      setSuccess("Workout deleted.");
    } catch (deleteError) {
      console.error("Workout delete error:", deleteError);
      setError("Could not delete workout.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <section className="admin-flow-card">
          <p className="admin-step-label">Step 1 of 3</p>
          <h2>{isWeekly ? "Select Week & Day" : "Select Date"}</h2>

          {isWeekly ? (
            <>
              <input
                type="date"
                value={weekStartDate}
                onChange={(event) => {
                  setWeekStartDate(startOfWeek(event.target.value));
                  setSelectedDayIndex(0);
                  setStep(0);
                }}
              />
              <div className="admin-week-days">
                {(weeklyPlan.days || []).map((day, index) => (
                  <button
                    key={day.date}
                    type="button"
                    className={index === selectedDayIndex ? "active" : ""}
                    onClick={() => chooseWeeklyDay(index)}
                  >
                    <strong>{day.dayName.slice(0, 3)}</strong>
                    <span>{day.date.slice(5)}</span>
                    <small>{day.exercises?.length ? "Assigned" : "Not assigned"}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          )}
        </section>
      );
    }

    if (step === 1) {
      return (
        <section className="admin-flow-card">
          <p className="admin-step-label">Step 2 of 3</p>
          <h2>Select Part & Workout</h2>

          <div className="admin-chip-grid">
            {bodyParts.map((part) => (
              <button
                key={part}
                type="button"
                className={part === bodyPart ? "active" : ""}
                onClick={() => {
                  setBodyPart(part);
                  setSearch("");
                }}
              >
                {part}
              </button>
            ))}
          </div>

          <label className="admin-search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workout"
            />
          </label>

          <label className="admin-select-label">
            <span>Workout</span>
            <select
              value={candidateExerciseId}
              onChange={(event) => setCandidateExerciseId(event.target.value)}
              disabled={exerciseLoading || exerciseRows.length === 0}
            >
              {exerciseRows.map((exercise) => (
                <option key={exercise.exerciseId} value={exercise.exerciseId}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>

          {exerciseLoading || loading ? (
            <div className="skeleton-panel tall" />
          ) : selectedCandidate ? (
            <div className="admin-workout-preview">
              <img
                src={selectedCandidate.imageUrl}
                alt={selectedCandidate.name}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div>
                <p>{selectedCandidate.primaryMuscles?.join(", ") || bodyPart}</p>
                <h3>{selectedCandidate.name}</h3>
                <span>{selectedCandidate.equipment}</span>
              </div>
              <button type="button" onClick={addCandidateExercise}>
                <Plus size={18} />
                Add Workout
              </button>
            </div>
          ) : (
            <div className="admin-empty-box">No workouts found.</div>
          )}

          <SelectedWorkoutTable
            bodyPart={bodyPart}
            exercises={selectedExercises}
            onDelete={deleteSelectedExercise}
            onUpdate={updateSelectedExercise}
          />
        </section>
      );
    }

    return (
      <section className="admin-flow-card">
        <p className="admin-step-label">Step 3 of 3</p>
        <h2>Review & Save</h2>
        <div className="admin-review-summary">
          <strong>{activeDate}</strong>
          <span>{bodyPart} · {selectedExercises.length} workouts</span>
        </div>
        <SelectedWorkoutTable
          bodyPart={bodyPart}
          exercises={selectedExercises}
          onDelete={deleteSelectedExercise}
          onUpdate={updateSelectedExercise}
        />
        <div className="admin-save-row">
          <button type="button" onClick={savePlan} disabled={saving}>
            {saving ? "Saving..." : currentPlanId ? "Update Workout" : "Save Workout"}
          </button>
          <button type="button" className="danger-btn" onClick={deletePlan} disabled={saving}>
            Delete
          </button>
        </div>
      </section>
    );
  };

  return (
    <AdminShell title={isWeekly ? "Weekly Workout" : "Daily Workout"}>
      {error && <div className="admin-notice error">{error}</div>}
      {success && <div className="admin-notice success">{success}</div>}

      <div className="admin-wizard-progress">
        {[0, 1, 2].map((item) => (
          <span key={item} className={item <= step ? "active" : ""} />
        ))}
      </div>

      {renderStep()}

      <div className="admin-wizard-actions">
        <button type="button" onClick={goBack} disabled={step === 0 || saving}>
          <ChevronLeft size={18} />
          Back
        </button>
        {step < 2 ? (
          <button type="button" onClick={goNext} disabled={saving}>
            Next
            <ChevronRight size={18} />
          </button>
        ) : (
          <button type="button" onClick={savePlan} disabled={saving}>
            <Check size={18} />
            {saving ? "Saving..." : currentPlanId ? "Update" : "Save"}
          </button>
        )}
      </div>
    </AdminShell>
  );
}

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

export default AdminWorkoutBuilder;
