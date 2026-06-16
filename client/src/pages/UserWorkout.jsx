import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import HomeWorkoutCalendar from "../components/HomeWorkoutCalendar";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function hasActivePurchase(profile, plan) {
  const now = Date.now();

  return (profile?.purchasedPlans || []).some((purchase) => {
    const expiry = purchase.planExpiryDate
      ? new Date(purchase.planExpiryDate).getTime()
      : null;

    return (
      purchase.plan === plan &&
      purchase.paymentStatus === "paid" &&
      (!expiry || expiry > now)
    );
  });
}

function UserWorkout({ routePlan = "" }) {
  const navigate = useNavigate();

  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [todayPlan, setTodayPlan] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);

  const selectedProgram = localStorage.getItem("buddySelectedProgram");
  const paymentStatus = localStorage.getItem("buddyPaymentStatus");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");
        const res = await api.get("/auth/profile");
        if (!cancelled) setProfile(res.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        if (!cancelled) setProfileError("Could not verify your membership. Please try again.");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTimer = async () => {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const [dailyRes, weeklyRes] = await Promise.all([
        api.get(`/workout-plans/daily?date=${dateKey}`),
        api.get("/weekly-workout/current"),
      ]);
      setTodayPlan(dailyRes.data);
      setWeeklyPlan(weeklyRes.data);
      setTimer({ startsAt: new Date().toISOString() });
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

  const dbSubscription = profile?.subscriptionStatus;
  const effectiveProgram =
    routePlan || profile?.selectedPlan || profile?.selectedProgram || selectedProgram;
  const hasPaidAccess =
    hasActivePurchase(profile, effectiveProgram) ||
    (profile?.selectedProgram === effectiveProgram && dbSubscription === "paid") ||
    (selectedProgram === effectiveProgram && paymentStatus === "paid");

  if (profileLoading) {
    return (
      <div className="elite-workout-page">
        <div className="skeleton-panel tall" />
        <div className="skeleton-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="elite-empty-card">
        <h2>Unable to Check Access</h2>
        <p>{profileError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!effectiveProgram) {
    return (
      <div className="elite-empty-card">
        <h2>Choose a Plan</h2>
        <p>Select a workout plan first to unlock your training area.</p>
        <button type="button" onClick={() => navigate("/")}>
          View Plans
        </button>
      </div>
    );
  }

  if (effectiveProgram && !hasPaidAccess) {
    return (
      <div className="elite-empty-card">
        <h2>Payment Required</h2>
        <p>Please complete payment to unlock this plan.</p>
        <button type="button" onClick={() => navigate(`/payment/${effectiveProgram}`)}>
          View Plans
        </button>
      </div>
    );
  }

  if (effectiveProgram === "home-workout") {
    return <HomeWorkoutCalendar />;
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
          <h2>{todayPlan?.title || timeLeft || "Loading..."}</h2>
          <span>
            {todayPlan
              ? `${todayPlan.exercises?.length || 0} exercises · resets in ${timeLeft || "..." }`
              : "Tap to view today’s workout"}
          </span>
        </div>

        <strong>Open</strong>
      </button>

      {weeklyPlan?.exercises?.length > 0 && (
        <section className="home-plan-day-card">
          <div className="home-plan-day-head">
            <h2>Weekly Workout</h2>
            <span>
              {weeklyPlan.weekStartDate} to {weeklyPlan.weekEndDate}
            </span>
          </div>

          <div className="daily-workout-main-card weekly-fixed-card">
            <div>
              <p>{weeklyPlan.bodyPart}</p>
              <h2>{weeklyPlan.title || `${weeklyPlan.bodyPart} Weekly Workout`}</h2>
              <span>{weeklyPlan.exercises.length} exercises · fixed weekly plan</span>
            </div>
            <strong>Week</strong>
          </div>

          <div className="dummy-workout-list">
            {weeklyPlan.exercises.map((exercise) => (
              <button
                type="button"
                className="dummy-workout-card home-exercise-row"
                key={exercise.exerciseId}
                onClick={() => navigate(`/workout-detail/weekly/${exercise.exerciseId}`)}
              >
                <img
                  src={exercise.imageUrl || FALLBACK_IMAGE}
                  alt={exercise.name}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div>
                  <p>{exercise.primaryMuscles?.join(", ") || weeklyPlan.bodyPart}</p>
                  <h2>{exercise.name}</h2>
                  <span>
                    {exercise.sets} sets · {exercise.reps} reps · {exercise.rest}s rest
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default UserWorkout;
