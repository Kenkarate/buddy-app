import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Dumbbell } from "lucide-react";
import { normalWorkoutParts } from "../data/dummyNormalWorkouts";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function label(value) {
  return value || "bodyweight";
}

function WorkoutList() {
  const navigate = useNavigate();
  const { part } = useParams();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedPart = normalWorkoutParts.find((item) => item.slug === part);

  useEffect(() => {
    let cancelled = false;

    async function loadExercises() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/exercises/bodypart/${part}?limit=100`);
        if (!cancelled) setExercises(res.data.exercises || []);
      } catch (loadError) {
        console.error("Failed to load exercises:", loadError);
        if (!cancelled) {
          setError("Exercise database is empty or unavailable. Run npm run seed:exercises.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadExercises();
    return () => {
      cancelled = true;
    };
  }, [part]);

  if (!selectedPart) {
    return (
      <div className="elite-empty-card">
        <h2>Workout Not Found</h2>
        <button onClick={() => navigate("/workouts")}>Back</button>
      </div>
    );
  }

  return (
    <div className="workout-list-page">
      <button className="elite-back-btn" onClick={() => navigate("/workouts")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div
        className="workout-list-hero"
        style={{ backgroundImage: `url(${selectedPart.image})` }}
      >
        <div>
          <p>Body Part</p>
          <h1>{selectedPart.part}</h1>
        </div>
      </div>

      {loading && <div className="trainer-empty-state">Loading exercises...</div>}

      {error && <div className="trainer-empty-state">{error}</div>}

      {!loading && !error && exercises.length === 0 && (
        <div className="trainer-empty-state">No exercises found for this body part.</div>
      )}

      {!loading && !error && (
        <div className="workout-name-list exercise-card-grid">
          {exercises.map((workout) => (
          <button
            key={workout.exerciseId}
            className="workout-name-card exercise-db-card"
            onClick={() => navigate(`/workout-detail/${selectedPart.slug}/${workout.exerciseId}`)}
          >
            <img
              src={workout.imageUrls?.[0] || FALLBACK_IMAGE}
              alt={workout.name}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div>
              <p>{workout.primaryMuscles?.[0] || workout.bodyPart}</p>
              <h2>{workout.name}</h2>
              <span>
                {label(workout.equipment)} · {label(workout.level)}
              </span>
            </div>

            <Dumbbell size={26} />
          </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkoutList;
