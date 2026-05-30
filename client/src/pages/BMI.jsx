import { useEffect, useState } from "react";
import { Save, UserRound, Flame, Droplet } from "lucide-react";
import api from "../api/api";

function calculateBodyFat({ gender, waist, neck, height }) {
  const w = Number(waist);
  const n = Number(neck);
  const h = Number(height);

  if (!w || !n || !h) return null;

  if (gender === "female") {
    return null;
  }

  const bodyFat =
    86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;

  return Number(bodyFat.toFixed(1));
}

function calculateCalories({ gender, weight, height, age, activity }) {
  const w = Number(weight);
  const h = Number(height);
  const a = Number(age);

  if (!w || !h || !a) return null;

  let bmr;

  if (gender === "female") {
    bmr = 10 * w + 6.25 * h - 5 * a - 161;
  } else {
    bmr = 10 * w + 6.25 * h - 5 * a + 5;
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  return Math.round(bmr * multipliers[activity]);
}

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function BMI() {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    gender: "male",
    age: "30",
    weight: "",
    height: "",
    waist: "",
    neck: "",
    activity: "moderate",
  });

  const loadRecords = async () => {
    const res = await api.get("/user/bmi");
    setRecords(res.data);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const updateField = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const calculate = async (e) => {
    e.preventDefault();

    const heightNumber = Number(form.height);
    const weightNumber = Number(form.weight);

    const heightM = heightNumber / 100;
    const bmi = Number((weightNumber / (heightM * heightM)).toFixed(1));
    const category = getBmiCategory(bmi);

    const bodyFat = calculateBodyFat(form);
    const calories = calculateCalories(form);

    await api.post("/user/bmi", {
      height: heightNumber,
      weight: weightNumber,
    });

    setResult({
      bmi,
      category,
      bodyFat,
      calories,
    });

    setShowForm(false);
    loadRecords();
  };

  return (
    <div className="performance-page">
      <div className="performance-header">
        <div>
          <h1>Performance Hub</h1>
          <p>Calculate and track your foundational metrics.</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={calculate} className="performance-form-card">
          <h2>Personal Data</h2>

          <div className="form-divider" />

          <div className="metric-form-grid">
            <label>
              <span>Gender</span>
              <select
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label>
              <span>Age</span>
              <input
                type="number"
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="30"
                required
              />
            </label>

            <label>
              <span>Weight (kg)</span>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="80"
                required
              />
            </label>

            <label>
              <span>Height (cm)</span>
              <input
                type="number"
                value={form.height}
                onChange={(e) => updateField("height", e.target.value)}
                placeholder="180"
                required
              />
            </label>

            <label>
              <span>Waist (cm)</span>
              <input
                type="number"
                value={form.waist}
                onChange={(e) => updateField("waist", e.target.value)}
                placeholder="80"
              />
            </label>

            <label>
              <span>Neck (cm)</span>
              <input
                type="number"
                value={form.neck}
                onChange={(e) => updateField("neck", e.target.value)}
                placeholder="38"
              />
            </label>
          </div>

          <label>
            <span>Activity Level</span>
            <select
              value={form.activity}
              onChange={(e) => updateField("activity", e.target.value)}
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Light Exercise</option>
              <option value="moderate">Moderate Exercise</option>
              <option value="active">Active</option>
              <option value="athlete">Athlete</option>
            </select>
          </label>

          <button>Calculate Metrics</button>
        </form>
      )}

      {!showForm && result && (
        <button className="edit-metrics-btn" onClick={() => setShowForm(true)}>
          Edit Personal Data
        </button>
      )}

      {result && (
        <>
          <h2 className="calculations-title">Calculations</h2>

          <div className="metric-result-card">
            <div>
              <p>Body Mass Index</p>
              <h3>
                {result.bmi}
                <span>BMI</span>
              </h3>
              <small>{result.category}</small>
            </div>

            <UserRound size={30} />
          </div>

          <div className="metric-result-card">
            <div>
              <p>Estimated Body Fat</p>
              <h3>
                {result.bodyFat || "--"}
                <span>%</span>
              </h3>
              <small>
                {result.bodyFat
                  ? "Based on waist, neck and height"
                  : "Add waist and neck to calculate"}
              </small>
            </div>

            <Droplet size={30} />
          </div>

          <div className="metric-result-card">
            <div>
              <p>Target Daily Calories</p>
              <h3>
                {result.calories}
                <span>KCAL</span>
              </h3>
              <small>Estimated maintenance calories</small>
            </div>

            <Flame size={30} />
          </div>

          <button className="sync-profile-btn">
            <Save size={22} />
            Sync to Profile
          </button>
        </>
      )}

      {!result && records.length > 0 && (
        <>
          <h2 className="calculations-title">Previous BMI</h2>

          {records.slice(0, 2).map((record) => (
            <div className="metric-result-card" key={record._id}>
              <div>
                <p>Body Mass Index</p>
                <h3>
                  {record.bmi}
                  <span>BMI</span>
                </h3>
                <small>
                  {record.height} cm / {record.weight} kg
                </small>
              </div>

              <UserRound size={30} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default BMI;