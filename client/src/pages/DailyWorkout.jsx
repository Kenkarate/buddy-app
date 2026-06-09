import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function secondsUntilTomorrow() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((tomorrow - now) / 1000));
}

function formatCountdown(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function DailyWorkout() {
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTimer, setActiveTimer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState({});
  const [countdown, setCountdown] = useState(secondsUntilTomorrow());

  const today = getLocalDateKey();
  const exercises = useMemo(() => plan?.exercises || [], [plan]);

  useEffect(() => {
    let cancelled = false;

    async function loadTodayWorkout() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/workout-plans/daily?date=${today}`);
        if (!cancelled) setPlan(res.data);
      } catch (loadError) {
        console.error("Failed to load daily workout:", loadError);
        if (!cancelled) setError("Could not load today’s workout.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTodayWorkout();
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(secondsUntilTomorrow()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (plan?._id) {
      api.post("/workout-events", {
        workoutId: plan._id,
        exerciseId: plan._id,
        workoutName: plan.title,
        eventType: "view",
        source: "daily",
      }).catch(() => {});
    }
  }, [plan]);

  useEffect(() => {
    let interval;

    if (running && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }

    if (secondsLeft === 0) {
      setRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [running, secondsLeft]);

  const startTimer = (exercise) => {
    setActiveTimer(exercise._id || exercise.exerciseId);
    setSecondsLeft(exercise.rest || 60);
    setRunning(true);
  };

  const resetTimer = (exercise) => {
    setActiveTimer(exercise._id || exercise.exerciseId);
    setSecondsLeft(exercise.rest || 60);
    setRunning(false);
  };

  const markChecked = async (exercise) => {
    const id = exercise._id || exercise.exerciseId;
    setChecked((prev) => ({ ...prev, [id]: true }));
    await api.post("/workout-events", {
      workoutId: plan?._id,
      exerciseId: exercise.exerciseId,
      workoutName: exercise.name,
      eventType: "checked",
      source: "daily",
    }).catch(() => {});
  };

  return (
    <div className="daily-workout-page">
      <button className="elite-back-btn" onClick={() => navigate("/workouts")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="daily-workout-hero">
        <p>{today}</p>
        <h1>{plan?.title || "Daily Workout"}</h1>
        <span>
          {plan
            ? `${plan.bodyPart} · next workout in ${formatCountdown(countdown)}`
            : "Today’s workout will appear here once trainer assigns it."}
        </span>
      </div>

      {loading ? (
        <div className="skeleton-panel tall" />
      ) : error ? (
        <div className="trainer-empty-state admin-error-state">{error}</div>
      ) : !plan || exercises.length === 0 ? (
        <div className="trainer-empty-state">
          No workout assigned for today.
        </div>
      ) : (
        <div className="daily-workout-list">
          {exercises.map((exercise) => {
            const timerId = exercise._id || exercise.exerciseId;
            const isActive = activeTimer === timerId;

            return (
              <div className="daily-workout-exercise" key={timerId}>
                <div className="daily-gif-box">
                  <img
                    src={exercise.imageUrl || FALLBACK_IMAGE}
                    alt={exercise.name}
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="daily-exercise-info">
                  <p>{exercise.primaryMuscles?.join(", ") || plan.bodyPart}</p>
                  <h2>{exercise.name}</h2>

                  <div className="daily-exercise-stats">
                    <span>{exercise.sets} Sets</span>
                    <span>{exercise.reps}</span>
                    <span>{exercise.rest}s Rest</span>
                  </div>

                  {exercise.notes && <small>{exercise.notes}</small>}

                  <div className="daily-timer-mini">
                    <Timer size={20} />
                    <strong>{isActive ? `${secondsLeft}s` : `${exercise.rest}s`}</strong>

                    <button
                      onClick={() => {
                        if (!isActive) {
                          startTimer(exercise);
                          return;
                        }
                        setRunning(!running);
                      }}
                    >
                      {isActive && running ? <Pause size={16} /> : <Play size={16} />}
                      {isActive && running ? "Pause" : "Start"}
                    </button>

                    <button
                      className="timer-reset-small"
                      onClick={() => resetTimer(exercise)}
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>

                  <button
                    className="daily-check-btn"
                    onClick={() => markChecked(exercise)}
                    disabled={Boolean(checked[timerId])}
                  >
                    <CheckCircle2 size={18} />
                    {checked[timerId] ? "Checked" : "Mark Checked"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DailyWorkout;
