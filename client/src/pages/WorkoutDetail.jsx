import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw, Timer } from "lucide-react";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function prescription(level) {
  if (level === "expert") return { sets: 5, reps: "8 reps" };
  if (level === "intermediate") return { sets: 4, reps: "10 reps" };
  return { sets: 3, reps: "12 reps" };
}

function WorkoutDetail() {
  const navigate = useNavigate();
  const { part, id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const defaults = prescription(workout?.level);

  useEffect(() => {
    let cancelled = false;

    async function loadExercise() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/exercises/${id}`);
        if (!cancelled) {
          setWorkout(res.data);
          setSecondsLeft(res.data.restSeconds || 60);
        }
      } catch (loadError) {
        console.error("Failed to load exercise:", loadError);
        if (!cancelled) setError("Exercise not found.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExercise();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!workout) return;

    api.post("/workout-events", {
      workoutId: workout._id || workout.id || workout.exerciseId,
      exerciseId: workout.exerciseId,
      workoutName: workout.name,
      eventType: "view",
      source: part === "home-workout" ? "home" : "normal",
    }).catch(() => {});
  }, [part, workout]);

  useEffect(() => {
    if (!running) return;

    if (secondsLeft <= 0) {
      setRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [running, secondsLeft]);

  if (loading) {
    return <div className="trainer-empty-state">Loading exercise...</div>;
  }

  if (!workout || error) {
    return (
      <div className="elite-empty-card">
        <h2>{error || "Workout Not Found"}</h2>
        <button onClick={() => navigate("/workouts")}>Back</button>
      </div>
    );
  }

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(workout.restSeconds || 60);
  };

  const markComplete = async () => {
    await api.post("/workout-events", {
      workoutId: workout._id || workout.id || workout.exerciseId,
      exerciseId: workout.exerciseId,
      workoutName: workout.name,
      eventType: "complete",
      source: part === "home-workout" ? "home" : "normal",
    }).catch(() => {});
  };

  return (
    <div className="workout-detail-page">
      <button className="elite-back-btn" onClick={() => navigate(`/workout-list/${part}`)}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="workout-gif-card">
        <img
          src={workout.imageUrls?.[0] || workout.imageUrl || FALLBACK_IMAGE}
          alt={workout.name}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
      </div>

      <div className="workout-detail-card">
        <p>{workout.primaryMuscles?.join(", ") || workout.bodyPart}</p>
        <h1>{workout.name}</h1>
        <span>{workout.level || "beginner"} · {workout.equipment || "bodyweight"}</span>

        <div className="workout-detail-grid">
          <div>
            <small>Sets</small>
            <strong>{defaults.sets}</strong>
          </div>

          <div>
            <small>Reps</small>
            <strong>{defaults.reps}</strong>
          </div>

          <div>
            <small>Rest</small>
            <strong>{workout.restSeconds || 60}s</strong>
          </div>
        </div>

        <div className="timer-box">
          <div>
            <Timer size={26} />
            <h2>{secondsLeft}s</h2>
            <p>Rest Timer</p>
          </div>

          <div className="timer-actions">
            <button onClick={() => setRunning(!running)}>
              {running ? <Pause size={18} /> : <Play size={18} />}
              {running ? "Pause" : "Start"}
            </button>

            <button onClick={resetTimer} className="reset-timer-btn">
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        <button className="daily-check-btn" onClick={markComplete}>
          Mark Completed
        </button>

        <div className="instruction-card">
          <h3>How to do it</h3>
          <ol>
            {(workout.instructions?.length
              ? workout.instructions
              : [workout.beginnerCaption || "Move slowly and keep control through the full range."]
            ).map((step, index) => (
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default WorkoutDetail;
