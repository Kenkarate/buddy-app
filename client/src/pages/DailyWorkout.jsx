import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function DailyWorkout() {
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [running, setRunning] = useState(false);

  const today = getLocalDateKey();

  const loadTodayWorkout = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/normal-workout-schedules/${today}`);
      setSchedule(res.data);
    } catch (error) {
      console.error("Failed to load daily workout:", error);
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayWorkout();
  }, []);

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

  const startTimer = (workout) => {
    setActiveTimer(workout._id || workout.workoutId);
    setSecondsLeft(workout.restSeconds || 45);
    setRunning(true);
  };

  const resetTimer = (workout) => {
    setActiveTimer(workout._id || workout.workoutId);
    setSecondsLeft(workout.restSeconds || 45);
    setRunning(false);
  };

  return (
    <div className="daily-workout-page">
      <button className="elite-back-btn" onClick={() => navigate("/workouts")}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="daily-workout-hero">
        <p>{today}</p>
        <h1>Daily Workout</h1>
        <span>
          {schedule
            ? `${schedule.bodyPart} workout assigned by trainer`
            : "Today’s workout will appear here once trainer assigns it."}
        </span>
      </div>

      {loading ? (
        <div className="trainer-empty-state">Loading today’s workout...</div>
      ) : !schedule || !schedule.workouts || schedule.workouts.length === 0 ? (
        <div className="trainer-empty-state">
          No workout assigned for today.
        </div>
      ) : (
        <div className="daily-workout-list">
          {schedule.workouts.map((workout) => {
            const timerId = workout._id || workout.workoutId;
            const isActive = activeTimer === timerId;

            return (
              <div className="daily-workout-exercise" key={timerId}>
                <div className="daily-gif-box">
                  <img
                    src={workout.gif || workout.image}
                    alt={workout.workoutName}
                  />
                </div>

                <div className="daily-exercise-info">
                  <p>{workout.bodyPart}</p>
                  <h2>{workout.workoutName}</h2>

                  <div className="daily-exercise-stats">
                    <span>{workout.sets} Sets</span>
                    <span>{workout.reps}</span>
                    <span>{workout.restSeconds}s Rest</span>
                  </div>

                  {workout.notes && <small>{workout.notes}</small>}

                  <div className="daily-timer-mini">
                    <Timer size={20} />

                    <strong>
                      {isActive ? `${secondsLeft}s` : `${workout.restSeconds}s`}
                    </strong>

                    <button
                      onClick={() => {
                        if (!isActive) {
                          startTimer(workout);
                          return;
                        }

                        setRunning(!running);
                      }}
                    >
                      {isActive && running ? (
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DailyWorkout;