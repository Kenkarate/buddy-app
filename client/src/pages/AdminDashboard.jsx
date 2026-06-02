import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCircle,
  Dumbbell,
  Flame,
  Menu,
  Trophy,
  Users,
  Utensils,
} from "lucide-react";
import api from "../api/api";

function AdminDashboard() {
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [timerHours, setTimerHours] = useState(24);
  
  const [dailyWorkouts, setDailyWorkouts] = useState(() => {
    return JSON.parse(localStorage.getItem("buddyAdminDailyWorkouts") || "[]");
  });
  
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [settings, setSettings] = useState({
  trialDays: 0,
  freeWorkoutLimit: 0,
  defaultCurrency: "INR",
  adminNotifyBeforeWorkoutExpiryHours: 6,
});
  
  const [dailyWorkoutForm, setDailyWorkoutForm] = useState({
    name: "",
    bodyPart: "",
    sets: "",
    reps: "",
    rest: "",
    gif: "",
    notes: "",
  });
  
  const saveDailyWorkouts = (items) => {
    setDailyWorkouts(items);
    localStorage.setItem("buddyAdminDailyWorkouts", JSON.stringify(items));
  };
  
  const resetDailyWorkoutForm = () => {
    setEditingWorkoutId(null);
    setDailyWorkoutForm({
      name: "",
      bodyPart: "",
      sets: "",
      reps: "",
      rest: "",
      gif: "",
      notes: "",
    });
  };
  
  // const [dailyScheduleForm, setDailyScheduleForm] = useState({hours: 24});
const submitDailyWorkout = (e) => {
  e.preventDefault();

  if (editingWorkoutId) {
    const updated = dailyWorkouts.map((item) =>
      item.id === editingWorkoutId
        ? {
            ...item,
            ...dailyWorkoutForm,
            sets: Number(dailyWorkoutForm.sets),
            rest: Number(dailyWorkoutForm.rest),
          }
        : item
    );

    saveDailyWorkouts(updated);
    resetDailyWorkoutForm();
    return;
  }

  const newWorkout = {
    id: Date.now().toString(),
    ...dailyWorkoutForm,
    sets: Number(dailyWorkoutForm.sets),
    rest: Number(dailyWorkoutForm.rest),
  };

  saveDailyWorkouts([newWorkout, ...dailyWorkouts]);
  resetDailyWorkoutForm();
};

const editDailyWorkout = (workout) => {
  setEditingWorkoutId(workout.id);
  setDailyWorkoutForm({
    name: workout.name,
    bodyPart: workout.bodyPart,
    sets: workout.sets,
    reps: workout.reps,
    rest: workout.rest,
    gif: workout.gif,
    notes: workout.notes,
  });
};

const deleteDailyWorkout = (id) => {
  const confirmed = window.confirm("Delete this daily workout?");

  if (!confirmed) return;

  const updated = dailyWorkouts.filter((item) => item.id !== id);
  saveDailyWorkouts(updated);
};

  const [dailyScheduleForm, setDailyScheduleForm] = useState({
  currentWorkoutSlug: "mixed-workout",
  nextWorkoutSlug: "chest",
  hours: 24,
});

  const [workoutForm, setWorkoutForm] = useState({
    bodyPart: "Mixed",
    title: "",
    description: "",
    sets: "",
    reps: "",
    videoUrl: "",
  });

  const [dietForm, setDietForm] = useState({
    meal: "",
    food: "",
    calories: "",
    notes: "",
  });

  const loadClients = async () => {
    const loadSettings = async () => {
  try {
    const res = await api.get("/settings");
    setTimerHours(res.data.dailyWorkoutDurationHours || 24);
  } catch (error) {
    console.error(error);
  }
};

const updateDailyTimer = async (e) => {
  e.preventDefault();

  try {
    await api.post("/workout-data/daily-schedule", {
      currentWorkoutSlug: dailyScheduleForm.currentWorkoutSlug,
      nextWorkoutSlug: dailyScheduleForm.nextWorkoutSlug,
      hours: Number(dailyScheduleForm.hours),
    });

    alert("Daily workout schedule updated for everyone");
  } catch (error) {
    console.error("Failed to update daily schedule:", error);
    alert("Failed to update daily schedule");
  }
};
  };

useEffect(() => {
  loadClients();
  loadSettings();
}, []);

  const assignWorkout = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Select a client first");
      return;
    }

    try {
      await api.post("/admin-assignments/assign-workout", {
  userId,
  workoutPlanId,
});

      setWorkoutForm({
        bodyPart: "Mixed",
        title: "",
        description: "",
        sets: "",
        reps: "",
        videoUrl: "",
      });

      alert("Workout assigned");
    } catch (error) {
      console.error(error);
      alert("Failed to assign workout");
    }
  };

  const assignDiet = async (e) => {
    e.preventDefault();

    if (!selectedClientId) {
      alert("Select a client first");
      return;
    }

    try {
      await api.post("/admin-assignments/assign-diet", {
  userId,
  dietPlanId,
});

      setDietForm({
        meal: "",
        food: "",
        calories: "",
        notes: "",
      });

      alert("Diet assigned");
    } catch (error) {
      console.error(error);
      alert("Failed to assign diet");
    }
  };

  const logout = () => {
    localStorage.removeItem("buddyToken");
    localStorage.removeItem("buddyUser");
    navigate("/admin-login");
  };

  const selectedClient = clients.find((client) => client._id === selectedClientId);
  const updateDailyTimer = async (e) => {
  if (e) e.preventDefault();

  try {
    const hours = Number(dailyScheduleForm?.hours || timerHours || 24);

    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    localStorage.setItem(
      "buddyDailyWorkoutTimer",
      JSON.stringify({
        hours,
        expiresAt: expiresAt.toISOString(),
      })
    );

    alert("Daily workout timer updated");
  } catch (error) {
    console.error("Failed to update daily timer:", error);
    alert("Failed to update daily timer");
  }
};

const loadSettings = async () => {
  try {
    const savedSettings = localStorage.getItem("buddyAdminSettings");

    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
      return;
    }

    setSettings({
      trialDays: 0,
      freeWorkoutLimit: 0,
      defaultCurrency: "INR",
      adminNotifyBeforeWorkoutExpiryHours: 6,
    });
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
};

  return (
    <div className="admin-app-shell">
      <header className="admin-top-header">
        <Menu size={34} />
        <h1>Admin Dashboard</h1>

        <div className="admin-bell">
          <Bell size={30} />
          <span />
        </div>
      </header>

      <main className="admin-main-content">
        <section className="admin-welcome-row">
          <div className="admin-logo-circle">
            <Dumbbell size={42} />
          </div>

          <div>
            <h2>Welcome, Admin!</h2>
            <p>Here’s your fitness overview.</p>
          </div>

          <button className="analytics-btn">Analytics</button>
        </section>

        <section className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <h3>{clients.length}</h3>
            <p>Total Clients</p>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <Flame size={32} />
            </div>
            <h3>
              {clients.reduce(
                (total, client) => total + (client.assignedWorkouts?.length || 0),
                0
              )}
            </h3>
            <p>Workouts</p>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <CalendarDays size={32} />
            </div>
            <h3>
              {clients.reduce(
                (total, client) => total + (client.assignedDiet?.length || 0),
                0
              )}
            </h3>
            <p>Diet Plans</p>
          </div>

          <div className="admin-stat-card">
            <div className="stat-icon">
              <Trophy size={32} />
            </div>
            <h3>12</h3>
            <p>Achievements</p>
          </div>
        </section>

        <section className="daily-workout-card">
          <div className="daily-card-header">
            <div className="purple-square">
              <Dumbbell size={30} />
            </div>

            <div>
              <h2>Daily Workout</h2>
              <p>Today’s workout summary</p>
            </div>

            <button>View All</button>
          </div>

          <div className="daily-list">
            <div className="daily-item">
              <div className="daily-thumb pushup" />
              <div>
                <h3>Push Ups</h3>
                <p>Upper Body</p>
              </div>
              <span>4 Sets</span>
              <strong>40 Reps</strong>
            </div>

            <div className="daily-item">
              <div className="daily-thumb squat" />
              <div>
                <h3>Squats</h3>
                <p>Lower Body</p>
              </div>
              <span>4 Sets</span>
              <strong>50 Reps</strong>
            </div>

            <div className="daily-item">
              <div className="daily-thumb plank" />
              <div>
                <h3>Plank</h3>
                <p>Core</p>
              </div>
              <span>3 Sets</span>
              <strong>60 Sec</strong>
            </div>
          </div>

          <div className="daily-summary-row">
            <div>
              <Flame size={34} />
              <div>
                <h3>Total Time</h3>
                <p>32 min</p>
              </div>
            </div>

            <div>
              <Utensils size={34} />
              <div>
                <h3>Total Calories</h3>
                <p>320 kcal</p>
              </div>
            </div>
          </div>
        </section>

        <section className="weekly-card">
          <div className="weekly-header">
            <div className="purple-square">
              <CalendarDays size={30} />
            </div>

            <div>
              <h2>Weekly Workout</h2>
              <p>Your weekly progress</p>
            </div>

            <button>View Full Week</button>
          </div>

          <div className="week-days">
            {[
              ["Mon", "45 min", true],
              ["Tue", "50 min", true],
              ["Wed", "40 min", true],
              ["Thu", "25 min", false],
              ["Fri", "45 min", true],
              ["Sat", "-", false],
              ["Sun", "-", false],
            ].map(([day, time, done]) => (
              <div className="week-day" key={day}>
                <h4>{day}</h4>
                <div className={done ? "day-check done" : "day-check"}>
                  {done && <CheckCircle size={25} />}
                </div>
                <p>{time}</p>
              </div>
            ))}
          </div>

          <div className="weekly-progress">
            <div>
              <Dumbbell size={34} />
              <span>
                <strong>4</strong> / 6 Days
              </span>
            </div>

            <div className="progress-bar">
              <div />
            </div>

            <strong>67%</strong>
          </div>
        </section>
<section className="admin-action-panel timer-settings-card">
  <h2>Daily Workout Timer</h2>
  <p>Set today’s active workout and countdown time for all users.</p>

    <form className="admin-daily-form" onSubmit={updateDailyTimer}>
    <input
      type="number"
      min="1"
      placeholder="Timer hours"
      value={dailyScheduleForm.hours}
      onChange={(e) =>
        setDailyScheduleForm({
          ...dailyScheduleForm,
          hours: e.target.value,
        })
      }
      required
    />

    <input
      placeholder="Next workout slug"
      value={dailyScheduleForm.nextWorkoutSlug}
      onChange={(e) =>
        setDailyScheduleForm({
          ...dailyScheduleForm,
          nextWorkoutSlug: e.target.value,
        })
      }
      required
    />

    <input
      type="number"
      min="1"
      placeholder="Timer in hours"
      value={dailyScheduleForm.hours}
      onChange={(e) =>
        setDailyScheduleForm({
          ...dailyScheduleForm,
          hours: e.target.value,
        })
      }
      required
    />

    <button>Update Daily Workout</button>
  </form>

  <span>Current duration: {dailyScheduleForm.hours} hours</span>
</section>

        <section className="admin-action-panel">
          <h2>Manage Clients</h2>

          {clients.length === 0 && <p>No clients registered yet.</p>}

          {clients.length > 0 && (
            <>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                {clients.map((client) => (
                  <option value={client._id} key={client._id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>

              {selectedClient && (
                <div className="selected-client-card">
                  <h3>{selectedClient.name}</h3>
                  <p>{selectedClient.email}</p>
                  <span>{selectedClient.subscriptionStatus}</span>
                </div>
              )}
            </>
          )}
        </section>

        <section className="admin-form-grid">
          <form className="admin-action-panel" onSubmit={assignWorkout}>
            <h2>Assign Workout</h2>

            <select
              value={workoutForm.bodyPart}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  bodyPart: e.target.value,
                })
              }
            >
              <option>Mixed</option>
              <option>Chest</option>
              <option>Back</option>
              <option>Biceps</option>
              <option>Triceps</option>
              <option>Shoulders</option>
              <option>Legs</option>
              <option>Abs</option>
            </select>

            <input
              placeholder="Workout title"
              value={workoutForm.title}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  title: e.target.value,
                })
              }
              required
            />

            <textarea
              placeholder="Workout description"
              value={workoutForm.description}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  description: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Sets"
              value={workoutForm.sets}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  sets: e.target.value,
                })
              }
            />

            <input
              placeholder="Reps"
              value={workoutForm.reps}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  reps: e.target.value,
                })
              }
            />

            <input
              placeholder="Video URL"
              value={workoutForm.videoUrl}
              onChange={(e) =>
                setWorkoutForm({
                  ...workoutForm,
                  videoUrl: e.target.value,
                })
              }
            />

            <button>Assign Workout</button>
          </form>

          <form className="admin-action-panel" onSubmit={assignDiet}>
            <h2>Assign Diet</h2>

            <input
              placeholder="Meal name"
              value={dietForm.meal}
              onChange={(e) =>
                setDietForm({
                  ...dietForm,
                  meal: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Food items"
              value={dietForm.food}
              onChange={(e) =>
                setDietForm({
                  ...dietForm,
                  food: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Calories"
              value={dietForm.calories}
              onChange={(e) =>
                setDietForm({
                  ...dietForm,
                  calories: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Notes"
              value={dietForm.notes}
              onChange={(e) =>
                setDietForm({
                  ...dietForm,
                  notes: e.target.value,
                })
              }
            />

            <button>Assign Diet</button>
          </form>
        </section>

        <button className="admin-logout-btn" onClick={logout}>
          Logout
        </button>
      </main>

      <section className="admin-daily-manager">
  <div className="admin-section-heading">
    <div>
      <p>Daily Training</p>
      <h2>Daily Workout Manager</h2>
    </div>
  </div>

  <form className="admin-daily-form" onSubmit={submitDailyWorkout}>
    <input
      placeholder="Workout name"
      value={dailyWorkoutForm.name}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, name: e.target.value })
      }
      required
    />

    <input
      placeholder="Body part"
      value={dailyWorkoutForm.bodyPart}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, bodyPart: e.target.value })
      }
      required
    />

    <input
      type="number"
      placeholder="Sets"
      value={dailyWorkoutForm.sets}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, sets: e.target.value })
      }
      required
    />

    <input
      placeholder="Reps e.g. 12 reps"
      value={dailyWorkoutForm.reps}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, reps: e.target.value })
      }
      required
    />

    <input
      type="number"
      placeholder="Rest seconds"
      value={dailyWorkoutForm.rest}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, rest: e.target.value })
      }
      required
    />

    <input
      placeholder="GIF URL"
      value={dailyWorkoutForm.gif}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, gif: e.target.value })
      }
    />

    <textarea
      placeholder="Notes / instructions"
      value={dailyWorkoutForm.notes}
      onChange={(e) =>
        setDailyWorkoutForm({ ...dailyWorkoutForm, notes: e.target.value })
      }
    />

    <div className="admin-form-actions">
      <button type="submit">
        {editingWorkoutId ? "Update Workout" : "Add Workout"}
      </button>

      {editingWorkoutId && (
        <button type="button" onClick={resetDailyWorkoutForm}>
          Cancel Edit
        </button>
      )}
    </div>
  </form>

  <div className="admin-daily-list">
    {dailyWorkouts.length === 0 && (
      <div className="admin-empty-state">
        <h3>No daily workouts added</h3>
        <p>Add today’s workout using the form above.</p>
      </div>
    )}

    {dailyWorkouts.map((workout) => (
      <div className="admin-daily-item" key={workout.id}>
        <div>
          <p>{workout.bodyPart}</p>
          <h3>{workout.name}</h3>
          <span>
            {workout.sets} sets · {workout.reps} · {workout.rest}s rest
          </span>
        </div>

        <div className="admin-item-actions">
          <button onClick={() => editDailyWorkout(workout)}>Edit</button>
          <button onClick={() => deleteDailyWorkout(workout.id)}>Delete</button>
        </div>
      </div>
    ))}
  </div>
</section>

      <nav className="admin-bottom-nav">
        <button className="active">
          <Dumbbell size={31} />
          <span>Workout</span>
        </button>

        <button>
          <Utensils size={31} />
          <span>Diet</span>
        </button>

        <button>
          <Users size={31} />
          <span>Clients</span>
        </button>
      </nav>
    </div>
  );
}

export default AdminDashboard;