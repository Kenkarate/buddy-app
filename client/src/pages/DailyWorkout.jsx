import { useEffect, useState } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { todayWorkout } from "../data/dailyWorkoutData";

function DailyWorkout() {
  const navigate = useNavigate();
  const [activeTimer, setActiveTimer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [running, setRunning] = useState(false);

  const startTimer = (workout) => {
    setActiveTimer(workout.id);
    setSecondsLeft(workout.rest || 45);
    setRunning(true);
  };

  const resetTimer = (workout) => {
    setActiveTimer(workout.id);
    setSecondsLeft(workout.rest || 45);
    setRunning(false);
  };

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

    return () => clearInterval(interval);
  }, [running, secondsLeft]);

  return (
    <div className="daily-workout-page">
      <button className="elite-back-btn" onClick={() => navigate("/workouts")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="daily-workout-hero">
        <p>{todayWorkout.date}</p>
        <h1>{todayWorkout.title}</h1>
        <span>{todayWorkout.subtitle}</span>
      </div>

      <div className="daily-workout-list">
        {todayWorkout.workouts.map((workout) => (
          <div className="daily-workout-exercise" key={workout.id}>
            <div className="daily-gif-box">
              <img src={workout.gif} alt={workout.name} />
            </div>

            <div className="daily-exercise-info">
              <p>{workout.bodyPart}</p>
              <h2>{workout.name}</h2>

              <div className="daily-exercise-stats">
                <span>{workout.sets} Sets</span>
                <span>{workout.reps}</span>
                <span>{workout.rest}s Rest</span>
              </div>

              <small>{workout.notes}</small>

              <div className="daily-timer-mini">
                <Timer size={20} />

                <strong>
                  {activeTimer === workout.id ? `${secondsLeft}s` : `${workout.rest}s`}
                </strong>

                <button
                  onClick={() => {
                    if (activeTimer !== workout.id) {
                      startTimer(workout);
                      return;
                    }

                    setRunning(!running);
                  }}
                >
                  {activeTimer === workout.id && running ? (
                    <>
                      <Pause size={16} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Start
                    </>
                  )}
                </button>

                <button
                  className="timer-reset-small"
                  onClick={() => resetTimer(workout)}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DailyWorkout;