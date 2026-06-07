import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Edit,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import api from "../api/api";

const workoutLibrary = [
  {
    id: "push-ups",
    name: "Push Ups",
    bodyPart: "Chest",
    image:
      "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/5t9IcXiBCyw60XPpGu/giphy.gif",
    defaultSets: 4,
    defaultReps: "12",
    restSeconds: 45,
  },
  {
    id: "bench-press",
    name: "Bench Press",
    bodyPart: "Chest",
    image:
      "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/26ufg3mD6kX6CFE2A/giphy.gif",
    defaultSets: 4,
    defaultReps: "10",
    restSeconds: 60,
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    bodyPart: "Biceps",
    image:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/3o6ZsYzuLyRfSGX4f6/giphy.gif",
    defaultSets: 3,
    defaultReps: "12",
    restSeconds: 45,
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    bodyPart: "Biceps",
    image:
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/3o7aD4ubUVr8EkgQF2/giphy.gif",
    defaultSets: 3,
    defaultReps: "12",
    restSeconds: 45,
  },
  {
    id: "tricep-dips",
    name: "Tricep Dips",
    bodyPart: "Triceps",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    defaultSets: 3,
    defaultReps: "12",
    restSeconds: 45,
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    bodyPart: "Back",
    image:
      "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/3o7btNhMBytxAM6YBa/giphy.gif",
    defaultSets: 4,
    defaultReps: "10",
    restSeconds: 60,
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    bodyPart: "Shoulders",
    image:
      "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    defaultSets: 4,
    defaultReps: "10",
    restSeconds: 60,
  },
  {
    id: "squats",
    name: "Squats",
    bodyPart: "Legs",
    image:
      "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/l0MYwONBGDS7aPGOk/giphy.gif",
    defaultSets: 4,
    defaultReps: "15",
    restSeconds: 60,
  },
  {
    id: "plank",
    name: "Plank",
    bodyPart: "Abs",
    image:
      "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?q=80&w=900&auto=format&fit=crop",
    gif: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    defaultSets: 3,
    defaultReps: "45 sec",
    restSeconds: 45,
  },
];

const bodyParts = [
  "Chest",
  "Biceps",
  "Triceps",
  "Back",
  "Shoulders",
  "Legs",
  "Abs",
];

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function AdminDashboard() {
  const today = getLocalDateKey();

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthSchedules, setMonthSchedules] = useState([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState("Chest");
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sets: "",
    reps: "",
    restSeconds: "",
    notes: "",
  });

  const monthKey = getMonthKey(calendarDate);

  const selectedSchedule = monthSchedules.find(
    (schedule) => schedule.dateKey === selectedDate
  );

  const assignedDateMap = useMemo(() => {
    const map = {};

    monthSchedules.forEach((schedule) => {
      map[schedule.dateKey] = schedule;
    });

    return map;
  }, [monthSchedules]);

  const filteredWorkouts = useMemo(() => {
    return workoutLibrary.filter(
      (workout) => workout.bodyPart === selectedBodyPart
    );
  }, [selectedBodyPart]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const blanks = firstDay.getDay();
    const days = [];

    for (let i = 0; i < blanks; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      const date = new Date(year, month, day);
      days.push({
        day,
        dateKey: getLocalDateKey(date),
      });
    }

    return days;
  }, [calendarDate]);

  const loadMonthSchedules = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/normal-workout-schedules?month=${monthKey}`);
      setMonthSchedules(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load month schedules:", error);
      alert("Failed to load calendar schedules");
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDate = async () => {
    try {
      const res = await api.get(`/normal-workout-schedules/${selectedDate}`);

      if (res.data) {
        setSelectedBodyPart(res.data.bodyPart || "Chest");
        setAssignedWorkouts(res.data.workouts || []);
      } else {
        setSelectedBodyPart("Chest");
        setAssignedWorkouts([]);
      }

      resetWorkoutForm();
    } catch (error) {
      console.error("Failed to load selected date:", error);
      setSelectedBodyPart("Chest");
      setAssignedWorkouts([]);
    }
  };

  useEffect(() => {
    loadMonthSchedules();
  }, [monthKey]);

  useEffect(() => {
    loadSelectedDate();
  }, [selectedDate]);

  const resetWorkoutForm = () => {
    setSelectedWorkout(null);
    setEditingId(null);
    setForm({
      sets: "",
      reps: "",
      restSeconds: "",
      notes: "",
    });
  };

  const persistSchedule = async (rows, bodyPart = selectedBodyPart) => {
    try {
      setSaving(true);

      const res = await api.put(`/normal-workout-schedules/${selectedDate}`, {
        bodyPart,
        workouts: rows,
      });

      setAssignedWorkouts(res.data.workouts || []);

      setMonthSchedules((prev) => {
        const exists = prev.some((item) => item.dateKey === selectedDate);

        if (exists) {
          return prev.map((item) =>
            item.dateKey === selectedDate ? res.data : item
          );
        }

        return [...prev, res.data].sort((a, b) =>
          a.dateKey.localeCompare(b.dateKey)
        );
      });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      alert(error.response?.data?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (direction) => {
    const next = new Date(calendarDate);
    next.setMonth(next.getMonth() + direction);
    setCalendarDate(next);
  };

  const selectCalendarDate = (dateKey) => {
    setSelectedDate(dateKey);
  };

  const handleBodyPartChange = (part) => {
    if (assignedWorkouts.length > 0 && part !== selectedBodyPart) {
      alert(
        "Only one body part can be assigned for one date. Delete current workouts first to change body part."
      );
      return;
    }

    setSelectedBodyPart(part);
    resetWorkoutForm();
  };

  const selectWorkout = (workout) => {
    setSelectedWorkout(workout);
    setEditingId(null);

    setForm({
      sets: workout.defaultSets,
      reps: workout.defaultReps,
      restSeconds: workout.restSeconds,
      notes: "",
    });
  };

  const addOrUpdateWorkout = async (e) => {
    e.preventDefault();

    if (!selectedWorkout) {
      alert("Select a workout first");
      return;
    }

    const row = {
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      bodyPart: selectedBodyPart,
      image: selectedWorkout.image,
      gif: selectedWorkout.gif,
      sets: Number(form.sets),
      reps: String(form.reps),
      restSeconds: Number(form.restSeconds),
      notes: form.notes,
    };

    if (editingId) {
      const updatedRows = assignedWorkouts.map((item) =>
        item._id === editingId || item.id === editingId
          ? {
              ...item,
              ...row,
            }
          : item
      );

      await persistSchedule(updatedRows);
      resetWorkoutForm();
      return;
    }

    const updatedRows = [...assignedWorkouts, row];

    await persistSchedule(updatedRows);
    resetWorkoutForm();
  };

  const editWorkout = (item) => {
    const workout = workoutLibrary.find(
      (workoutItem) => workoutItem.id === item.workoutId
    );

    setSelectedWorkout(
      workout || {
        id: item.workoutId,
        name: item.workoutName,
        bodyPart: item.bodyPart,
        image: item.image,
        gif: item.gif,
        defaultSets: item.sets,
        defaultReps: item.reps,
        restSeconds: item.restSeconds,
      }
    );

    setSelectedBodyPart(item.bodyPart);
    setEditingId(item._id || item.id);

    setForm({
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes || "",
    });
  };

  const deleteWorkout = async (item) => {
    const confirmed = window.confirm("Delete this workout from this date?");
    if (!confirmed) return;

    const updatedRows = assignedWorkouts.filter(
      (workout) => (workout._id || workout.id) !== (item._id || item.id)
    );

    if (updatedRows.length === 0) {
      try {
        setSaving(true);

        await api.delete(`/normal-workout-schedules/${selectedDate}`);

        setAssignedWorkouts([]);
        setMonthSchedules((prev) =>
          prev.filter((schedule) => schedule.dateKey !== selectedDate)
        );
        resetWorkoutForm();
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        alert("Failed to delete schedule");
      } finally {
        setSaving(false);
      }

      return;
    }

    await persistSchedule(updatedRows);
  };

  const logout = () => {
    localStorage.removeItem("buddyAdminToken");
    localStorage.removeItem("buddyToken");
    window.location.href = "/admin-login";
  };

  return (
    <div className="trainer-dashboard-page">
      <header className="trainer-top-header">
        <div>
          <p>Trainer Panel</p>
          <h1>Normal Workout Dashboard</h1>
          <span>Assign one body part workout for each date.</span>
        </div>

        <button onClick={logout}>Logout</button>
      </header>

      <section className="trainer-stats-grid">
        <div>
          <CalendarDays size={24} />
          <strong>{monthSchedules.length}</strong>
          <span>Scheduled Days</span>
        </div>

        <div>
          <Dumbbell size={24} />
          <strong>{workoutLibrary.length}</strong>
          <span>Workout Library</span>
        </div>

        <div>
          <Save size={24} />
          <strong>{assignedWorkouts.length}</strong>
          <span>Selected Date</span>
        </div>
      </section>

      <section className="trainer-card calendar-card">
        <div className="calendar-header-row">
          <button onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>

          <div>
            <p>Calendar View</p>
            <h2>
              {calendarDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          <button onClick={() => changeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="trainer-empty-state">Loading calendar...</div>
        ) : (
          <div className="trainer-calendar">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div className="calendar-weekday" key={day}>
                {day}
              </div>
            ))}

            {calendarDays.map((item, index) => {
              if (!item) {
                return <div className="calendar-day empty" key={index} />;
              }

              const schedule = assignedDateMap[item.dateKey];
              const isSelected = item.dateKey === selectedDate;
              const isToday = item.dateKey === today;

              return (
                <button
                  key={item.dateKey}
                  className={[
                    "calendar-day",
                    isSelected ? "selected" : "",
                    isToday ? "today" : "",
                    schedule ? "assigned" : "",
                  ].join(" ")}
                  onClick={() => selectCalendarDate(item.dateKey)}
                >
                  <span>{item.day}</span>

                  {schedule && (
                    <div className="calendar-assigned-pill">
                      <strong>{schedule.bodyPart}</strong>
                      <small>{schedule.workouts?.length || 0} workouts</small>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="trainer-card date-summary-card">
        <div>
          <p>Selected Date</p>
          <h2>{selectedDate}</h2>
          <span>
            {selectedSchedule
              ? `${selectedSchedule.bodyPart} assigned`
              : "No workout assigned yet"}
          </span>
        </div>

        {saving && <strong>Saving...</strong>}
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 1</p>
          <h2>Select One Body Part</h2>
        </div>

        <div className="body-part-tabs">
          {bodyParts.map((part) => (
            <button
              key={part}
              type="button"
              className={selectedBodyPart === part ? "active" : ""}
              onClick={() => handleBodyPartChange(part)}
            >
              {part}
            </button>
          ))}
        </div>
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 2</p>
          <h2>Select Workout</h2>
        </div>

        <div className="trainer-workout-grid">
          {filteredWorkouts.map((workout) => (
            <button
              type="button"
              key={workout.id}
              className={
                selectedWorkout?.id === workout.id
                  ? "trainer-workout-card active"
                  : "trainer-workout-card"
              }
              onClick={() => selectWorkout(workout)}
            >
              <img src={workout.image} alt={workout.name} />

              <div>
                <p>{workout.bodyPart}</p>
                <h3>{workout.name}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 3</p>
          <h2>Enter Sets & Reps</h2>
        </div>

        {selectedWorkout ? (
          <form className="assignment-form" onSubmit={addOrUpdateWorkout}>
            <div className="selected-workout-box">
              <strong>{selectedWorkout.name}</strong>
              <span>{selectedWorkout.bodyPart}</span>
            </div>

            <div className="trainer-form-grid three">
              <label>
                Sets
                <input
                  type="number"
                  min="1"
                  value={form.sets}
                  onChange={(e) => setForm({ ...form, sets: e.target.value })}
                  required
                />
              </label>

              <label>
                Reps
                <input
                  value={form.reps}
                  onChange={(e) => setForm({ ...form, reps: e.target.value })}
                  placeholder="12 or 45 sec"
                  required
                />
              </label>

              <label>
                Rest Sec
                <input
                  type="number"
                  min="0"
                  value={form.restSeconds}
                  onChange={(e) =>
                    setForm({ ...form, restSeconds: e.target.value })
                  }
                  required
                />
              </label>
            </div>

            <label>
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional instruction for clients"
              />
            </label>

            <div className="assignment-actions">
              <button type="submit" disabled={saving}>
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {editingId ? "Update Workout" : "Add Workout"}
              </button>

              <button type="button" onClick={resetWorkoutForm}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="trainer-empty-state">
            Select a workout card first.
          </div>
        )}
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 4</p>
          <h2>Assigned Workouts</h2>
        </div>

        {assignedWorkouts.length === 0 ? (
          <div className="trainer-empty-state">
            No workouts assigned for this date.
          </div>
        ) : (
          <div className="assignment-table-wrap">
            <table className="assignment-table">
              <thead>
                <tr>
                  <th>Workout</th>
                  <th>Part</th>
                  <th>Sets</th>
                  <th>Reps</th>
                  <th>Rest</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {assignedWorkouts.map((item) => (
                  <tr key={item._id || item.id || item.workoutId}>
                    <td>{item.workoutName}</td>
                    <td>{item.bodyPart}</td>
                    <td>{item.sets}</td>
                    <td>{item.reps}</td>
                    <td>{item.restSeconds}s</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => editWorkout(item)}>
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteWorkout(item)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;