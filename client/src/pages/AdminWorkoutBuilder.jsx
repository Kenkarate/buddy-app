import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Edit, Plus, Search, Trash2 } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

const bodyParts = ["Chest", "Back", "Shoulder", "Arms", "Legs", "Abs", "Full Body", "Cardio"];

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

function nextSunday(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() + ((7 - day) % 7));
  return toDateKey(date);
}

function isSunday(dateKey) {
  return new Date(`${dateKey}T00:00:00`).getDay() === 0;
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function emptyWeeklyPlan(weekSundayDate) {
  return {
    weekSundayDate,
    weekStartDate: addDays(weekSundayDate, 1),
    weekEndDate: addDays(weekSundayDate, 7),
    bodyPart: "Chest",
    title: "Chest Weekly Workout",
    exercises: [],
    isActive: true,
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

  const [step, setStep] = useState(-1);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekSundayDate, setWeekSundayDate] = useState(nextSunday());
  const [dailyPlan, setDailyPlan] = useState(null);
  const [dailyMonthPlans, setDailyMonthPlans] = useState([]);
  const [weeklyMonthPlans, setWeeklyMonthPlans] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState(emptyWeeklyPlan(nextSunday()));
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

  const activeDate = isWeekly ? weekSundayDate : selectedDate;
  const currentPlanId = isWeekly ? weeklyPlan?._id : dailyPlan?._id;
  const selectedCandidate = exerciseRows.find((exercise) => exercise.exerciseId === candidateExerciseId);
  const monthKey = getMonthKey(calendarDate);

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map((exercise) => exercise.exerciseId)),
    [selectedExercises]
  );

  const dailyPlanMap = useMemo(() => {
    const map = {};
    dailyMonthPlans.forEach((plan) => {
      map[plan.date] = plan;
    });
    return map;
  }, [dailyMonthPlans]);

  const weeklyPlanMap = useMemo(() => {
    const map = {};
    weeklyMonthPlans.forEach((plan) => {
      map[plan.weekSundayDate] = plan;
    });
    return map;
  }, [weeklyMonthPlans]);

  const dailyCalendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let index = 0; index < firstDay.getDay(); index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, month, day);
      days.push({ day, dateKey: toDateKey(date) });
    }

    return days;
  }, [calendarDate]);

  const weeklyCalendarSundays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const sundays = [];

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      if (date.getDay() === 0) {
        const dateKey = toDateKey(date);
        sundays.push({
          day,
          dateKey,
          weekStartDate: addDays(dateKey, 1),
          weekEndDate: addDays(dateKey, 7),
        });
      }
    }

    return sundays;
  }, [calendarDate]);

  const loadDailyMonthPlans = async () => {
    if (isWeekly) return;

    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/admin/daily-workouts?month=${monthKey}`);
      setDailyMonthPlans(res.data.plans || []);
    } catch (loadError) {
      console.error("Daily month load error:", loadError);
      setError("Could not load workout calendar.");
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyMonthPlans = async () => {
    if (!isWeekly) return;

    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/admin/weekly-workouts?month=${monthKey}`);
      setWeeklyMonthPlans(res.data.plans || []);
    } catch (loadError) {
      console.error("Weekly month load error:", loadError);
      setError("Could not load weekly workout calendar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyMonthPlans();
  }, [isWeekly, monthKey]);

  useEffect(() => {
    loadWeeklyMonthPlans();
  }, [isWeekly, monthKey]);

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
        const res = await api.get(`/admin/weekly-workout?weekSundayDate=${weekSundayDate}`);
        const plan = res.data || emptyWeeklyPlan(weekSundayDate);
        setWeeklyPlan(plan);
        setBodyPart(plan?.bodyPart || "Chest");
        setSelectedExercises(plan?.exercises || []);
      } catch (loadError) {
        console.error("Weekly workout load error:", loadError);
        setError("Could not load this week.");
      } finally {
        setLoading(false);
      }
    }

    loadWeekly();
  }, [isWeekly, weekSundayDate]);

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

  const openDailyPlan = (dateKey, plan = null, nextStep = 1) => {
    setSelectedDate(dateKey);
    setDailyPlan(plan);
    setBodyPart(plan?.bodyPart || "Chest");
    setSelectedExercises(plan?.exercises || []);
    setSuccess("");
    setError("");
    setStep(nextStep);
  };

  const openWeeklyPlan = (sundayDate, plan = null, nextStep = 1) => {
    setWeekSundayDate(sundayDate);
    const nextPlan = plan || emptyWeeklyPlan(sundayDate);
    setWeeklyPlan(nextPlan);
    setBodyPart(nextPlan?.bodyPart || "Chest");
    setSelectedExercises(nextPlan?.exercises || []);
    setSuccess("");
    setError("");
    setStep(nextStep);
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
        if (!isSunday(weekSundayDate)) {
          setError("Weekly workouts can only be assigned on Sundays.");
          return;
        }

        const payload = {
          weekSundayDate,
          bodyPart,
          title: `${bodyPart} Weekly Workout`,
          exercises: selectedExercises,
          isActive: true,
        };
        const res = currentPlanId
          ? await api.put(`/admin/weekly-workout/${currentPlanId}`, payload)
          : await api.post("/admin/weekly-workout", payload);
        setWeeklyPlan(res.data);
        await loadWeeklyMonthPlans();
        setSuccess("Weekly workout saved.");
        setStep(-1);
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
      await loadDailyMonthPlans();
      setSuccess(currentPlanId ? "Daily workout updated." : "Daily workout saved.");
      setStep(-1);
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
        await api.delete(`/admin/weekly-workout/${currentPlanId}`);
        setWeeklyPlan(emptyWeeklyPlan(weekSundayDate));
        setSelectedExercises([]);
        await loadWeeklyMonthPlans();
      } else {
        await api.delete(`/admin/daily-workout/${currentPlanId}`);
        setDailyPlan(null);
        setSelectedExercises([]);
        await loadDailyMonthPlans();
      }
      setSuccess("Workout deleted.");
      setStep(-1);
    } catch (deleteError) {
      console.error("Workout delete error:", deleteError);
      setError("Could not delete workout.");
    } finally {
      setSaving(false);
    }
  };

  const deleteDailyFromOverview = async (plan) => {
    const confirmed = window.confirm("Delete this assigned workout?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await api.delete(`/admin/daily-workout/${plan._id}`);
      await loadDailyMonthPlans();
      if (selectedDate === plan.date) {
        setDailyPlan(null);
        setSelectedExercises([]);
      }
      setSuccess("Workout deleted.");
    } catch (deleteError) {
      console.error("Daily overview delete error:", deleteError);
      setError("Could not delete workout.");
    } finally {
      setSaving(false);
    }
  };

  const deleteWeeklyFromOverview = async (plan) => {
    if (!plan?._id) return;

    const confirmed = window.confirm("Delete this weekly workout?");
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await api.delete(`/admin/weekly-workout/${plan._id}`);
      if (plan.weekSundayDate === weekSundayDate) {
        setWeeklyPlan(emptyWeeklyPlan(weekSundayDate));
        setSelectedExercises([]);
      }
      await loadWeeklyMonthPlans();
      setSuccess("Workout deleted.");
    } catch (deleteError) {
      console.error("Weekly overview delete error:", deleteError);
      setError("Could not delete workout.");
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
              <p className="admin-step-label">Calendar</p>
              <h2>{isWeekly ? "Weekly Plan" : "Daily Workouts"}</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isWeekly) {
                  openWeeklyPlan(weekSundayDate, weeklyPlanMap[weekSundayDate] || null, 0);
                  return;
                }

                openDailyPlan(today, dailyPlanMap[today] || null, 0);
              }}
            >
              <Plus size={18} />
              Add Workout
            </button>
          </div>

          {isWeekly ? (
            <>
              <div className="admin-month-switcher">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() - 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="admin-calendar-list">
                {weeklyCalendarSundays.map((sunday) => {
                  const plan = weeklyPlanMap[sunday.dateKey];
                  const assigned = plan?.exercises?.length > 0;
                  return (
                    <article key={sunday.dateKey} className={assigned ? "assigned" : ""}>
                      <div>
                        <strong>Sunday {sunday.day}</strong>
                        <span>{sunday.weekStartDate} to {sunday.weekEndDate}</span>
                        <small>
                          {assigned
                            ? `${plan.title || `${plan.bodyPart} Weekly Workout`} · ${plan.exercises.length} workouts`
                            : "Not assigned for this week"}
                        </small>
                      </div>
                      <div className="admin-calendar-actions">
                        <button
                          type="button"
                          onClick={() => openWeeklyPlan(sunday.dateKey, plan || null, assigned ? 2 : 1)}
                        >
                          {assigned ? <Edit size={16} /> : <Plus size={16} />}
                        </button>
                        {assigned && (
                          <button type="button" onClick={() => deleteWeeklyFromOverview(plan)}>
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="admin-month-switcher">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() - 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {loading ? (
                <div className="skeleton-grid">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className="admin-calendar-grid">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                    <div className="admin-calendar-weekday" key={`${day}-${index}`}>
                      {day}
                    </div>
                  ))}
                  {dailyCalendarDays.map((item, index) => {
                    if (!item) return <div key={`blank-${index}`} />;
                    const plan = dailyPlanMap[item.dateKey];
                    return (
                      <article key={item.dateKey} className={plan ? "assigned" : ""}>
                        <button
                          type="button"
                          onClick={() => openDailyPlan(item.dateKey, plan || null, plan ? 2 : 1)}
                        >
                          <strong>{item.day}</strong>
                          <span>{plan ? plan.bodyPart : "Empty"}</span>
                        </button>
                        {plan && (
                          <div className="admin-calendar-actions">
                            <button type="button" onClick={() => openDailyPlan(item.dateKey, plan, 2)}>
                              <Edit size={15} />
                            </button>
                            <button type="button" onClick={() => deleteDailyFromOverview(plan)}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      );
    }

    if (step === 0) {
      return (
        <section className="admin-flow-card">
          <p className="admin-step-label">Step 1 of 3</p>
          <h2>{isWeekly ? "Select Sunday" : "Select Date"}</h2>

          {isWeekly ? (
            <>
              <p className="admin-helper-text">
                Weekly workouts can be assigned only on Sundays. The plan runs from the next Monday through Sunday.
              </p>

              <div className="admin-month-switcher">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() - 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronLeft size={18} />
                </button>
                <strong>
                  {calendarDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="admin-week-days sunday-only">
                {weeklyCalendarSundays.map((sunday) => {
                  const plan = weeklyPlanMap[sunday.dateKey];
                  return (
                  <button
                    key={sunday.dateKey}
                    type="button"
                    className={sunday.dateKey === weekSundayDate ? "active" : ""}
                    onClick={() => openWeeklyPlan(sunday.dateKey, plan || null, 0)}
                  >
                    <strong>Sun</strong>
                    <span>{sunday.dateKey.slice(5)}</span>
                    <small>{plan?.exercises?.length ? "Assigned" : "Not assigned"}</small>
                  </button>
                );
                })}
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
          <strong>
            {isWeekly ? `Sunday ${weekSundayDate}` : activeDate}
          </strong>
          <span>
            {isWeekly
              ? `${addDays(weekSundayDate, 1)} to ${addDays(weekSundayDate, 7)} · ${bodyPart} · ${selectedExercises.length} workouts`
              : `${bodyPart} · ${selectedExercises.length} workouts`}
          </span>
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

      {step >= 0 && (
        <div className="admin-wizard-progress">
          {[0, 1, 2].map((item) => (
            <span key={item} className={item <= step ? "active" : ""} />
          ))}
        </div>
      )}

      {renderStep()}

      {step >= 0 && (
        <div className="admin-wizard-actions">
          <button
            type="button"
            onClick={step === 0 ? () => setStep(-1) : goBack}
            disabled={saving}
          >
            <ChevronLeft size={18} />
            {step === 0 ? "Calendar" : "Back"}
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
