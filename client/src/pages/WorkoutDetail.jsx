import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { normalWorkoutParts } from "../data/dummyNormalWorkouts";

function WorkoutDetail() {
  const navigate = useNavigate();
  const { part, id } = useParams();

  const selectedPart = normalWorkoutParts.find((item) => item.slug === part);
  const workout = selectedPart?.workouts.find((item) => item.id === id);

  const [secondsLeft, setSecondsLeft] = useState(workout?.rest || 45);
  const [running, setRunning] = useState(false);

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

  if (!workout || !selectedPart) {
    return (
      <div className="elite-empty-card">
        <h2>Workout Not Found</h2>
        <button onClick={() => navigate("/workouts")}>Back</button>
      </div>
    );
  }

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft(workout.rest || 45);
  };

  return (
    <div className="workout-detail-page">
      <button className="elite-back-btn" onClick={() => navigate(`/workout-list/${part}`)}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="workout-gif-card">
        <img src={workout.gif} alt={workout.name} />
      </div>

      <div className="workout-detail-card">
        <p>{selectedPart.part}</p>
        <h1>{workout.name}</h1>
        <span>{workout.level}</span>

        <div className="workout-detail-grid">
          <div>
            <small>Sets</small>
            <strong>{workout.sets}</strong>
          </div>

          <div>
            <small>Reps</small>
            <strong>{workout.reps}</strong>
          </div>

          <div>
            <small>Rest</small>
            <strong>{workout.rest}s</strong>
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

        <div className="instruction-card">
          <h3>How to do it</h3>
          <p>{workout.instructions}</p>
        </div>
      </div>
    </div>
  );
}

export default WorkoutDetail;