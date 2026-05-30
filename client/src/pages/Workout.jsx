import { useEffect, useState } from "react";
import api from "../api/api";

function Workout() {
  const [workouts, setWorkouts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    day: "",
  });

  const loadWorkouts = async () => {
    const res = await api.get("/workouts");
    setWorkouts(res.data);
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/workouts", form);

    setForm({
      title: "",
      description: "",
      day: "",
    });

    loadWorkouts();
  };

  return (
    <div>
      <h1>Workout</h1>

      <form onSubmit={handleSubmit} className="card">
        <input
          placeholder="Workout title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <input
          placeholder="Day"
          value={form.day}
          onChange={(e) => setForm({ ...form, day: e.target.value })}
          required
        />

        <textarea
          placeholder="Workout details"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <button>Add Workout</button>
      </form>

      {workouts.map((workout, index) => (
        <div className="card" key={index}>
          <h3>{workout.title}</h3>
          <p>{workout.day}</p>
          <p>{workout.description}</p>
        </div>
      ))}
    </div>
  );
}

export default Workout;