import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { normalWorkoutParts } from "../data/dummyNormalWorkouts";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function getStoredArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

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
  const homeWorkouts = getStoredArray("buddyHomeWorkouts");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [homePlan, setHomePlan] = useState([]);
  const [homePlanLoading, setHomePlanLoading] = useState(false);
  const [homePlanError, setHomePlanError] = useState("");

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

  useEffect(() => {
    const effectiveProgram =
      routePlan || profile?.selectedPlan || profile?.selectedProgram || selectedProgram;
    if (effectiveProgram !== "home-workout") return;

    let cancelled = false;

    async function loadHomePlan() {
      try {
        setHomePlanLoading(true);
        setHomePlanError("");
        const res = await api.get("/exercises/home-plan");
        if (!cancelled) setHomePlan(res.data.days || []);
      } catch (error) {
        console.error("Failed to load home plan:", error);
        if (!cancelled) setHomePlanError("Run npm run seed:exercises to load home workout exercises.");
      } finally {
        if (!cancelled) setHomePlanLoading(false);
      }
    }

    loadHomePlan();
    return () => {
      cancelled = true;
    };
  }, [profile?.selectedPlan, profile?.selectedProgram, routePlan, selectedProgram]);

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
    return (
      <div className="elite-workout-page">
        <section className="target-zones-header">
          <div>
            <h1>Home Workouts</h1>
            <p>30 days · 5 beginner/intermediate exercises per day</p>
          </div>
        </section>

        {homePlanLoading && <div className="trainer-empty-state">Loading home workout plan...</div>}
        {homePlanError && <div className="trainer-empty-state">{homePlanError}</div>}

        {!homePlanLoading && !homePlanError && (
          <div className="home-plan-days">
            {homePlan.map((day) => (
              <section className="home-plan-day-card" key={day.day}>
                <div className="home-plan-day-head">
                  <h2>Day {day.day}</h2>
                  <span>{day.exercises?.length || 0} exercises</span>
                </div>

                <div className="dummy-workout-list">
                  {(day.exercises || []).map((workout) => (
                    <button
                      type="button"
                      className="dummy-workout-card home-exercise-row"
                      key={workout.exerciseId}
                      onClick={() => navigate(`/workout-detail/${workout.bodyPart}/${workout.exerciseId}`)}
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
                        <span>{workout.equipment || "bodyweight"} · {workout.level || "beginner"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {homeWorkouts.length > 0 && homePlan.length === 0 && (
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
        )}
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
              <div className="dummy-workout-card home-exercise-row" key={exercise.exerciseId}>
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
              </div>
            ))}
          </div>
        </section>
      )}

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
