import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import AdminShell from "../components/AdminShell";
import SelectedWorkoutTable from "../components/SelectedWorkoutTable";
import api from "../api/api";
import adminApi from "../api/adminApi";
import { bodyParts, mapExercise, FALLBACK_IMAGE } from "../lib/workoutShared";

const DAYS = Array.from({ length: 30 }, (_, index) => index + 1);

function AdminHomeWorkout() {
  // step -1 = day grid, 1 = pick exercises, 2 = review & save
  const [step, setStep] = useState(-1);
  const [dayPlans, setDayPlans] = useState([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentPlanId, setCurrentPlanId] = useState(null);
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

  const selectedCandidate = exerciseRows.find((ex) => ex.exerciseId === candidateExerciseId);

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map((ex) => ex.exerciseId)),
    [selectedExercises]
  );

  const dayPlanMap = useMemo(() => {
    const map = {};
    dayPlans.forEach((plan) => {
      map[plan.day] = plan;
    });
    return map;
  }, [dayPlans]);

  const loadDays = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.get("/admin/home-workout-days");
      setDayPlans(res.data.days || []);
    } catch (loadError) {
      console.error("Home workout days load error:", loadError);
      setError("Could not load the home workout program.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDays();
  }, []);

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

  const openDay = (day, plan = null, nextStep = 1) => {
    setSelectedDay(day);
    setCurrentPlanId(plan?._id || null);
    setBodyPart(plan?.bodyPart || "Chest");
    setSelectedExercises(plan?.exercises || []);
    setSearch("");
    setSuccess("");
    setError("");
    setStep(nextStep);
  };

  const addCandidateExercise = () => {
    if (!selectedCandidate) {
      setError("Select a workout first.");
      return;
    }
    if (selectedIds.has(selectedCandidate.exerciseId)) {
      setError("This workout is already in the selected list.");
      return;
    }
    setError("");
    setSelectedExercises((prev) => [...prev, selectedCandidate]);
  };

  const deleteSelectedExercise = (exerciseId) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.exerciseId !== exerciseId));
  };

  const updateSelectedExercise = (exerciseId, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex))
    );
  };

  const goNext = () => {
    if (step === 1 && selectedExercises.length === 0) {
      setError("Add at least one workout before continuing.");
      return;
    }
    setError("");
    setStep((prev) => Math.min(prev + 1, 2));
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

      const payload = {
        bodyPart,
        title: `Day ${selectedDay} · ${bodyPart}`,
        exercises: selectedExercises,
      };
      const res = await adminApi.put(`/admin/home-workout-day/${selectedDay}`, payload);
      setCurrentPlanId(res.data?._id || null);
      await loadDays();
      setSuccess(`Day ${selectedDay} saved.`);
      setStep(-1);
    } catch (saveError) {
      console.error("Home workout save error:", saveError);
      setError(saveError.message || "Could not save this day.");
    } finally {
      setSaving(false);
    }
  };

  const deleteDay = async (day) => {
    const confirmed = window.confirm(`Delete the workout for Day ${day}?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await adminApi.delete(`/admin/home-workout-day/${day}`);
      await loadDays();
      if (selectedDay === day) {
        setSelectedExercises([]);
        setCurrentPlanId(null);
      }
      setSuccess(`Day ${day} deleted.`);
    } catch (deleteError) {
      console.error("Home workout delete error:", deleteError);
      setError("Could not delete this day.");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (step === -1) {
      return (
        <section className="admin-flow-card">
          <div className="admin-calendar-head">
            <div>
              <p className="admin-step-label">Program</p>
              <h2>Home Workout · 30 Days</h2>
            </div>
          </div>

          <p className="admin-helper-text">
            Build a numbered 30-day program. Each user unlocks one new day every 24h, starting
            from the day they subscribe.
          </p>

          {loading ? (
            <div className="skeleton-grid">
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : (
            <div className="admin-calendar-grid">
              {DAYS.map((day) => {
                const plan = dayPlanMap[day];
                return (
                  <article key={day} className={plan ? "assigned" : ""}>
                    <button type="button" onClick={() => openDay(day, plan || null, plan ? 2 : 1)}>
                      <strong>Day {day}</strong>
                      <span>{plan ? plan.bodyPart : "Empty"}</span>
                    </button>
                    {plan && (
                      <div className="admin-calendar-actions">
                        <button type="button" onClick={() => openDay(day, plan, 2)}>
                          <Edit size={15} />
                        </button>
                        <button type="button" onClick={() => deleteDay(day)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      );
    }

    if (step === 1) {
      return (
        <section className="admin-flow-card">
          <p className="admin-step-label">Day {selectedDay} · Step 1 of 2</p>
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

          {exerciseLoading ? (
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
        <p className="admin-step-label">Day {selectedDay} · Step 2 of 2</p>
        <h2>Review & Save</h2>
        <div className="admin-review-summary">
          <strong>Day {selectedDay}</strong>
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
            {saving ? "Saving..." : currentPlanId ? "Update Day" : "Save Day"}
          </button>
          {currentPlanId && (
            <button
              type="button"
              className="danger-btn"
              onClick={() => deleteDay(selectedDay)}
              disabled={saving}
            >
              Delete
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <AdminShell title="Home Workout">
      {error && (
        <div className="admin-notice error">
          <span>{error}</span>
          <button type="button" className="admin-notice-dismiss" onClick={() => setError("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {success && (
        <div className="admin-notice success">
          <span>{success}</span>
          <button type="button" className="admin-notice-dismiss" onClick={() => setSuccess("")} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {step >= 0 && (
        <div className="admin-wizard-progress">
          {[1, 2].map((item) => (
            <span key={item} className={item <= step ? "active" : ""} />
          ))}
        </div>
      )}

      {renderStep()}

      {step >= 0 && (
        <div className="admin-wizard-actions">
          <button type="button" onClick={() => (step === 1 ? setStep(-1) : setStep(1))} disabled={saving}>
            <ChevronLeft size={18} />
            {step === 1 ? "Days" : "Back"}
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
      )}
    </AdminShell>
  );
}

export default AdminHomeWorkout;
