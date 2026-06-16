import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Lock } from "lucide-react";
import api from "../api/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

const DAY_MS = 24 * 60 * 60 * 1000;
const TOTAL_DAYS = 30;

function formatCountdown(ms) {
  if (ms <= 0) return "now";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

function HomeWorkoutCalendar() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/home-workout/plan");
        if (!cancelled) setData(res.data);
      } catch (loadError) {
        console.error("Failed to load home workout plan:", loadError);
        if (!cancelled) setError("Could not load your home workout plan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dayMap = useMemo(() => {
    const map = {};
    (data?.days || []).forEach((day) => {
      map[day.day] = day;
    });
    return map;
  }, [data]);

  const start = data?.startDate ? new Date(data.startDate).getTime() : null;
  const expiry = data?.expiryDate ? new Date(data.expiryDate).getTime() : null;
  const expired = Boolean(expiry && now > expiry) || data?.hasAccess === false;

  const unlockTimeFor = (dayNumber) => (start != null ? start + (dayNumber - 1) * DAY_MS : null);
  const isUnlocked = (dayNumber) => {
    if (expired || start == null) return false;
    const unlockAt = unlockTimeFor(dayNumber);
    return now >= unlockAt;
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="elite-empty-card">
        <h2>Unable to Load</h2>
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!start) {
    return (
      <div className="elite-empty-card">
        <h2>Plan Starting Soon</h2>
        <p>Your 30-day home workout unlocks day by day once your subscription is active.</p>
      </div>
    );
  }

  // Detail view for a single unlocked day.
  if (selectedDay != null) {
    const day = dayMap[selectedDay];
    const exercises = day?.exercises || [];

    return (
      <div className="daily-workout-page">
        <button className="elite-back-btn" onClick={() => setSelectedDay(null)}>
          <ArrowLeft size={18} />
          All Days
        </button>

        <div className="daily-workout-hero">
          <p>Day {selectedDay} of {TOTAL_DAYS}</p>
          <h1>{day?.title || `Day ${selectedDay}`}</h1>
          <span>{day ? `${day.bodyPart} · ${exercises.length} exercises` : "Rest day"}</span>
        </div>

        {exercises.length === 0 ? (
          <div className="trainer-empty-state">Rest day — no workout scheduled.</div>
        ) : (
          <div className="dummy-workout-list">
            {exercises.map((exercise) => (
              <button
                type="button"
                className="dummy-workout-card home-exercise-row"
                key={exercise.exerciseId}
                onClick={() => navigate(`/workout-detail/home-workout/${exercise.exerciseId}`)}
              >
                <img
                  src={exercise.imageUrl || FALLBACK_IMAGE}
                  alt={exercise.name}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div>
                  <p>{exercise.primaryMuscles?.join(", ") || day.bodyPart}</p>
                  <h2>{exercise.name}</h2>
                  <span>
                    {exercise.sets} sets · {exercise.reps} · {exercise.rest}s rest
                  </span>
                </div>
                <ChevronRight size={18} className="home-exercise-chevron" />
              </button>
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
          <h1>Home Workouts</h1>
          <p>
            {expired
              ? "Your 30-day plan has ended. Renew to continue."
              : "One new day unlocks every 24 hours"}
          </p>
        </div>
      </section>

      <div className="home-cal-grid">
        {Array.from({ length: TOTAL_DAYS }, (_, index) => index + 1).map((dayNumber) => {
          const day = dayMap[dayNumber];
          const unlocked = isUnlocked(dayNumber);
          const unlockAt = unlockTimeFor(dayNumber);
          const restDay = !day || (day.exercises || []).length === 0;

          return (
            <button
              key={dayNumber}
              type="button"
              className={`home-cal-day${unlocked ? " unlocked" : " locked"}`}
              disabled={!unlocked}
              onClick={() => unlocked && setSelectedDay(dayNumber)}
            >
              <strong>Day {dayNumber}</strong>
              {unlocked ? (
                <>
                  <span>{restDay ? "Rest" : day.bodyPart}</span>
                  <small>{restDay ? "—" : `${day.exercises.length} ex`}</small>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <small>
                    {expired ? "Locked" : `in ${formatCountdown(unlockAt - now)}`}
                  </small>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HomeWorkoutCalendar;
