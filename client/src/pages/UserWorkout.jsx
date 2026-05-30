import { useEffect, useState } from "react";
import { ArrowRight, Lock, Share2 } from "lucide-react";
import api from "../api/api";


const targetZones = [
  {
    label: "Back",
    value: "Back",
    image:
      "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Chest",
    value: "Chest",
    image:
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Core",
    value: "Abs",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Legs",
    value: "Legs",
    locked: true,
    tag: "Elite",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Shoulders",
    value: "Shoulders",
    image:
      "https://images.unsplash.com/photo-1532384748853-8f54a8f476e2?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Triceps",
    value: "Triceps",
    locked: true,
    tag: "Elite",
    image:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Biceps",
    value: "Biceps",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=900&auto=format&fit=crop",
  },
  {
    label: "Mixed",
    value: "Mixed",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=900&auto=format&fit=crop",
  },
];

function UserWorkout() {
  const [workouts, setWorkouts] = useState([]);
  const [selectedPart, setSelectedPart] = useState("");
  const [timer, setTimer] = useState(null);
const [timeLeft, setTimeLeft] = useState("");

  const loadWorkouts = async () => {
    const res = await api.get("/workout-data/plans");
    setWorkouts(res.data);
  };

  useEffect(() => {
    loadWorkouts();
     loadTimer();
  }, []);
  useEffect(() => {
  if (!timer) return;

  const interval = setInterval(() => {
    setTimeLeft(calculateTimeLeft(timer));
  }, 1000);

  return () => clearInterval(interval);
}, [timer]);

  const selectedWorkouts = workouts.filter(
    (workout) => workout.bodyPart?.toLowerCase() === selectedPart.toLowerCase()
  );

  if (selectedPart) {
    return (
      <div className="target-zone-detail">
        <button className="elite-back-btn" onClick={() => setSelectedPart("")}>
          Back to Target Zones
        </button>

        <h1>{selectedPart} Sessions</h1>
        <p className="muted">Assigned exercises from your trainer.</p>

        {selectedWorkouts.length === 0 && (
          <div className="elite-empty-card">
            <h2>No Session Assigned</h2>
            <p>Your trainer has not assigned exercises for this zone yet.</p>
          </div>
        )}

        {selectedWorkouts.map((workout) => (
          <div className="elite-exercise-card" key={workout._id}>
            <div>
              <p>{workout.bodyPart}</p>
              <h3>{workout.title}</h3>
              <span>
                {workout.sets || "-"} sets · {workout.reps || "-"} reps
              </span>
            </div>

            {workout.description && <small>{workout.description}</small>}

            {workout.videoUrl && (
              <a href={workout.videoUrl} target="_blank">
                Watch Video
              </a>
            )}
          </div>
        ))}
      </div>
    );
  }
  const loadTimer = async () => {
  try {
    const res = await api.get("/workout-data/daily-schedule");
    setTimer(res.data);
  } catch (error) {
    console.error("Failed to load daily schedule:", error);
  }
};

const calculateTimeLeft = (schedule) => {
  if (!schedule?.expiresAt) return "";

  const endTime = new Date(schedule.expiresAt).getTime();
  const now = Date.now();
  const difference = endTime - now;

  if (difference <= 0) {
    return "Expired";
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference / (1000 * 60)) % 60);
  const seconds = Math.floor((difference / 1000) % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

  return (
    <div className="elite-workout-page">
      <section className="target-zones-header">
  <div>
    <h1>Target Zones</h1>
    <p>Body part specific sessions</p>
  </div>

  <button>See All</button>
</section>

<div className="daily-timer-card">
  <p>Daily Workout Timer</p>
  <h2>{timeLeft || "Loading..."}</h2>
 <span>
  Fixed until:{" "}
  {timer?.expiresAt ? new Date(timer.expiresAt).toLocaleString() : "Loading"}
</span>
</div>

      <div className="target-zone-grid">
        {targetZones.map((zone) => (
          <button
            key={zone.value}
            className={zone.locked ? "target-zone-card locked" : "target-zone-card"}
            style={{
              backgroundImage: `url(${zone.image})`,
            }}
            onClick={() => {
              if (!zone.locked) setSelectedPart(zone.value);
            }}
          >
            {zone.locked && (
              <div className="lock-box">
                <Lock size={28} />
              </div>
            )}

            <div className="zone-title-row">
              <h3>{zone.label}</h3>
              {zone.tag && <span>{zone.tag}</span>}
            </div>
          </button>
        ))}
      </div>

      <section className="buddy-feed-header">
        <h2>Buddy Feed</h2>
        <ArrowRight size={30} />
      </section>

      <div className="buddy-feed-card">
        <span>Nutrition</span>
        <h3>High protein meals for better recovery</h3>

        <button className="share-floating-btn">
          <Share2 size={25} />
        </button>
      </div>
    </div>
  );
}

export default UserWorkout;