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
  const [profile, setProfile] = useState(null);



  useEffect(() => {
  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  loadProfile();
}, []);

const dbProgram = profile?.selectedProgram;
const dbSubscription = profile?.subscriptionStatus;

if (
  selectedProgram === "normal-workouts" &&
  dbSubscription !== "paid" &&
  paymentStatus !== "paid"
) {
  return (
    <div className="elite-empty-card">
      <h2>Payment Required</h2>
      <p>Please complete payment to unlock normal workouts.</p>
    </div>
  );
}

  const loadTimer = async () => {
    try {
      const res = await api.get("/workout-data/daily-schedule");
      setTimer(res.data);
    } catch (error) {
      console.error("Failed to load timer:", error);
    }
  };

  const calculateTimeLeft = (schedule) => {
  if (!schedule?.startsAt) return "";

  const startTime = new Date(schedule.startsAt).getTime();
  const duration = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const elapsed = now - startTime;
  const cyclesPassed = Math.floor(elapsed / duration);
  const nextExpiry = startTime + (cyclesPassed + 1) * duration;

  const difference = nextExpiry - now;

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

      <button
        className="daily-workout-main-card"
        onClick={() => navigate("/daily-workout")}
      >
        <div>
          <p>Daily Workout</p>
          <h2>{timeLeft || "Loading..."}</h2>
          <span>Tap to view today’s workout</span>
        </div>

        <strong>Open</strong>
      </button>

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