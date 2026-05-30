import { useEffect, useState } from "react";
import api from "../api/api";

function Diet() {
  const [dietPlans, setDietPlans] = useState([]);

  const [form, setForm] = useState({
    meal: "",
    food: "",
    calories: "",
  });

  const loadDietPlans = async () => {
    const res = await api.get("/diet");
    setDietPlans(res.data);
  };

  useEffect(() => {
    loadDietPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/diet", {
      meal: form.meal,
      food: form.food,
      calories: Number(form.calories),
    });

    setForm({
      meal: "",
      food: "",
      calories: "",
    });

    loadDietPlans();
  };

  return (
    <div>
      <h1>Diet Plan</h1>

      <form onSubmit={handleSubmit} className="card">
        <input
          placeholder="Meal"
          value={form.meal}
          onChange={(e) => setForm({ ...form, meal: e.target.value })}
          required
        />

        <input
          placeholder="Food"
          value={form.food}
          onChange={(e) => setForm({ ...form, food: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Calories"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
        />

        <button>Add Diet</button>
      </form>

      {dietPlans.map((item, index) => (
        <div className="card" key={index}>
          <h3>{item.meal}</h3>
          <p>{item.food}</p>
          <p>{item.calories} calories</p>
        </div>
      ))}
    </div>
  );
}

export default Diet;