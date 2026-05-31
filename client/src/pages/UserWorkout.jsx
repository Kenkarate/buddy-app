import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import api from "../api/api";
import { normalWorkoutParts } from "../data/dummyNormalWorkouts";

function UserWorkout() {
  const navigate = useNavigate();

  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  const selectedProgram = localStorage.getItem("buddySelectedProgram");
  const paymentStatus = localStorage.getItem("buddyPaymentStatus");
  const homeWorkouts = JSON.parse(localStorage.getItem("buddyHomeWorkouts") || "[]");

  const loadTimer = async () => {
    try {
      const res = await api.get("/workout-data/daily-schedule");
      setTimer(res.data);
    } catch (error) {
      console.error("Failed to load timer:", error);
    }
  };

  const calculateTimeLeft = (schedule) => {
    if (!schedule?.expiresAt) return "";

    const difference = new Date(schedule.expiresAt).getTime() - Date.now();

    if (difference <= 0) return "Expired";

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    loadTimer();
  }, []);

  useEffect(() => {
    if (!timer) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(timer));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  if (selectedProgram === "normal-workouts" && paymentStatus !== "paid") {
    return (
      <div className="elite-empty-card">
        <h2>Payment Required</h2>
        <p>Please complete payment to unlock normal workouts.</p>
      </div>
    );
  }

  if (selectedProgram === "home-workout") {
    return (
      <div className="elite-workout-page">
        <section className="target-zones-header">
          <div>
            <h1>Home Workouts</h1>
            <p>Based on your selected equipment</p>
          </div>
        </section>

        <div className="dummy-workout-list">
          {homeWorkouts.map((workout, index) => (
            <div className="dummy-workout-card" key={`${workout.name}-${index}`}>
              <p>{workout.muscle}</p>
              <h2>{workout.name}</h2>
              <span>
                {workout.sets} sets · {workout.reps}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="elite-workout-page">
      <section className="target-zones-header">
        <div>
          <h1>Normal Workout</h1>
          <p>Select a body part</p>
        </div>
      </section>

      <div className="daily-timer-card">
        <p>Daily Workout Timer</p>
        <h2>{timeLeft || "Loading..."}</h2>
        <span>
          Fixed until:{" "}
          {timer?.expiresAt ? new Date(timer.expiresAt).toLocaleString() : "Loading"}
        </span>
      </div>

      <div className="normal-part-grid">
        {normalWorkoutParts.map((item) => (
          <button
            key={item.slug}
            className="normal-part-card"
            onClick={() => navigate(`/workout-list/${item.slug}`)}
          >
            <img src={item.image} alt={item.part} />

            <div>
              <h2>{item.part}</h2>
              <span>{item.workouts.length} workouts</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default UserWorkout;