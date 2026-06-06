import { useMemo, useState } from "react";
import {
  CalendarDays,
  Dumbbell,
  Edit,
  Plus,
  Save,
  Trash2,
  Users,
} from "lucide-react";

const dummyClients = [
  { id: "client1", name: "Client 1", email: "client1@buddy.com" },
  { id: "client2", name: "Client 2", email: "client2@buddy.com" },
  { id: "client3", name: "Client 3", email: "client3@buddy.com" },
];

const workoutLibrary = [
  {
    id: "push-ups",
    name: "Push Ups",
    bodyPart: "Chest",
    image: "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?q=80&w=900&auto=format&fit=crop",
    defaultSets: 4,
    defaultReps: 12,
    restSeconds: 45,
  },
  {
    id: "bench-press",
    name: "Bench Press",
    bodyPart: "Chest",
    image: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=900&auto=format&fit=crop",
    defaultSets: 4,
    defaultReps: 10,
    restSeconds: 60,
  },
  {
    id: "bicep-curl",
    name: "Bicep Curl",
    bodyPart: "Biceps",
    image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=900&auto=format&fit=crop",
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 45,
  },
  {
    id: "tricep-dips",
    name: "Tricep Dips",
    bodyPart: "Triceps",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=900&auto=format&fit=crop",
    defaultSets: 3,
    defaultReps: 12,
    restSeconds: 45,
  },
  {
    id: "squats",
    name: "Squats",
    bodyPart: "Legs",
    image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?q=80&w=900&auto=format&fit=crop",
    defaultSets: 4,
    defaultReps: 15,
    restSeconds: 60,
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    bodyPart: "Shoulders",
    image: "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=900&auto=format&fit=crop",
    defaultSets: 4,
    defaultReps: 10,
    restSeconds: 60,
  },
];

const bodyParts = ["Chest", "Biceps", "Triceps", "Back", "Shoulders", "Legs", "Abs"];

function AdminDashboard() {
  const today = new Date().toISOString().split("T")[0];

  const [selectedClient, setSelectedClient] = useState("client1");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBodyPart, setSelectedBodyPart] = useState("Chest");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    sets: "",
    reps: "",
    restSeconds: "",
    notes: "",
  });

  const [assignments, setAssignments] = useState(() => {
    return JSON.parse(localStorage.getItem("buddyTrainerAssignments") || "[]");
  });

  const filteredWorkouts = useMemo(() => {
    return workoutLibrary.filter(
      (workout) => workout.bodyPart === selectedBodyPart
    );
  }, [selectedBodyPart]);

  const selectedClientData = dummyClients.find(
    (client) => client.id === selectedClient
  );

  const visibleAssignments = assignments.filter(
    (item) => item.clientId === selectedClient && item.date === selectedDate
  );

  const saveAssignments = (items) => {
    setAssignments(items);
    localStorage.setItem("buddyTrainerAssignments", JSON.stringify(items));
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

  const resetForm = () => {
    setSelectedWorkout(null);
    setEditingId(null);
    setForm({
      sets: "",
      reps: "",
      restSeconds: "",
      notes: "",
    });
  };

  const addOrUpdateAssignment = (e) => {
    e.preventDefault();

    if (!selectedWorkout) {
      alert("Select a workout first");
      return;
    }

    if (editingId) {
      const updated = assignments.map((item) =>
        item.id === editingId
          ? {
              ...item,
              sets: Number(form.sets),
              reps: form.reps,
              restSeconds: Number(form.restSeconds),
              notes: form.notes,
            }
          : item
      );

      saveAssignments(updated);
      resetForm();
      return;
    }

    const newAssignment = {
      id: Date.now().toString(),
      clientId: selectedClient,
      clientName: selectedClientData?.name || "Client",
      date: selectedDate,
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      bodyPart: selectedWorkout.bodyPart,
      sets: Number(form.sets),
      reps: form.reps,
      restSeconds: Number(form.restSeconds),
      notes: form.notes,
    };

    saveAssignments([...assignments, newAssignment]);
    resetForm();
  };

  const editAssignment = (item) => {
    const workout = workoutLibrary.find((workout) => workout.id === item.workoutId);

    setSelectedBodyPart(item.bodyPart);
    setSelectedWorkout(workout);
    setEditingId(item.id);

    setForm({
      sets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      notes: item.notes || "",
    });
  };

  const deleteAssignment = (id) => {
    const confirmed = window.confirm("Delete this assigned workout?");
    if (!confirmed) return;

    const updated = assignments.filter((item) => item.id !== id);
    saveAssignments(updated);
  };

  const logout = () => {
    localStorage.removeItem("buddyAdminToken");
    localStorage.removeItem("buddyToken");
    window.location.href = "/admin-login";
  };

  return (
    <div className="trainer-dashboard-page">
      <header className="trainer-dashboard-header">
        <div>
          <p>Trainer Panel</p>
          <h1>Dashboard</h1>
          <span>Assign daily workouts to your clients.</span>
        </div>

        <button onClick={logout}>Logout</button>
      </header>

      <section className="trainer-stats-grid">
        <div>
          <Users size={24} />
          <strong>{dummyClients.length}</strong>
          <span>Clients</span>
        </div>

        <div>
          <Dumbbell size={24} />
          <strong>{workoutLibrary.length}</strong>
          <span>Workouts</span>
        </div>

        <div>
          <CalendarDays size={24} />
          <strong>{assignments.length}</strong>
          <span>Assigned</span>
        </div>
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 1</p>
          <h2>Select Client & Date</h2>
        </div>

        <div className="trainer-form-grid">
          <label>
            Client
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              {dummyClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 2</p>
          <h2>Select Body Part</h2>
        </div>

        <div className="body-part-tabs">
          {bodyParts.map((part) => (
            <button
              key={part}
              className={selectedBodyPart === part ? "active" : ""}
              onClick={() => {
                setSelectedBodyPart(part);
                resetForm();
              }}
            >
              {part}
            </button>
          ))}
        </div>
      </section>

      <section className="trainer-card">
        <div className="trainer-section-title">
          <p>Step 3</p>
          <h2>Select Workout</h2>
        </div>

        <div className="trainer-workout-grid">
          {filteredWorkouts.map((workout) => (
            <button
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
          <p>Step 4</p>
          <h2>Enter Sets & Reps</h2>
        </div>

        {selectedWorkout ? (
          <form className="assignment-form" onSubmit={addOrUpdateAssignment}>
            <div className="selected-workout-box">
              <strong>{selectedWorkout.name}</strong>
              <span>{selectedWorkout.bodyPart}</span>
            </div>

            <div className="trainer-form-grid three">
              <label>
                Sets
                <input
                  type="number"
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
                  placeholder="12 or 12 each side"
                  required
                />
              </label>

              <label>
                Rest Sec
                <input
                  type="number"
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
                placeholder="Optional instruction for client"
              />
            </label>

            <div className="assignment-actions">
              <button type="submit">
                {editingId ? <Save size={18} /> : <Plus size={18} />}
                {editingId ? "Update Workout" : "Add Workout"}
              </button>

              <button type="button" onClick={resetForm}>
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
          <p>Step 5</p>
          <h2>Assigned Workouts</h2>
        </div>

        {visibleAssignments.length === 0 ? (
          <div className="trainer-empty-state">
            No workouts assigned for this client and date.
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
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {visibleAssignments.map((item) => (
                  <tr key={item.id}>
                    <td>{item.workoutName}</td>
                    <td>{item.bodyPart}</td>
                    <td>{item.sets}</td>
                    <td>{item.reps}</td>
                    <td>{item.restSeconds}s</td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => editAssignment(item)}>
                          <Edit size={16} />
                        </button>

                        <button onClick={() => deleteAssignment(item.id)}>
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