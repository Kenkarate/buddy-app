import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../api/api";

function Weight() {
  const [weight, setWeight] = useState("");
  const [records, setRecords] = useState([]);

  const loadRecords = async () => {
    const res = await api.get("/user/weight");

    const formatted = res.data.map((item) => ({
      weight: item.weight,
      date: new Date(item.date).toLocaleDateString(),
    }));

    setRecords(formatted);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const addWeight = async (e) => {
    e.preventDefault();

    await api.post("/user/weight", {
      weight: Number(weight),
    });

    setWeight("");
    loadRecords();
  };

  return (
    <div>
      <div className="page-header">
        <p className="eyebrow">Progress</p>
        <h1>Weight Tracking</h1>
      </div>

      <form onSubmit={addWeight} className="card">
        <input
          type="number"
          placeholder="Enter today’s weight in kg"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />

        <button>Add Weight</button>
      </form>

      <div className="chart-card">
        <h3>Progress Chart</h3>

        {records.length === 0 ? (
          <p>No weight records yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={records}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="weight" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Weight;