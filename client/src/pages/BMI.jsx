import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Dumbbell, Flame, Percent, UserRound } from "lucide-react";
import api from "../api/api";

function getBmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function calculateBodyFat({ gender, waist, neck, height }) {
  const w = Number(waist);
  const n = Number(neck);
  const h = Number(height);

  if (!w || !n || !h || w <= n) return null;

  let bodyFat;

  if (gender === "female") {
    bodyFat = 76.76 * Math.log10(w - n) - 68.15 * Math.log10(h) + 44.74;
  } else {
    bodyFat = 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
  }

  return Math.max(3, Number(bodyFat.toFixed(1)));
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

  const multiplierMap = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  return Math.round(bmr * multiplierMap[activity]);
}

function getSuggestion(bmi, bodyFat) {
  if (bmi >= 30) {
    return "Your BMI is high. Start with fat loss, strength training, walking, and a controlled diet. Personal training will help you avoid mistakes and stay consistent.";
  }

  if (bmi >= 25) {
    return "You are slightly above the healthy BMI range. A structured workout and fat-loss diet can help you cut safely.";
  }

  if (bmi < 18.5) {
    return "You are below the healthy BMI range. Focus on strength training and a calorie-surplus diet.";
  }

  if (bodyFat && bodyFat > 25) {
    return "Your BMI is normal, but fat percentage looks high. Focus on strength training and protein-based meals.";
  }

  return "Your numbers look decent. Keep tracking your progress and stay consistent.";
}

function BMI() {
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    gender: "male",
    age: "27",
    weight: "96",
    height: "177",
    waist: "80",
    neck: "32",
    activity: "active",
  });

  useEffect(() => {
    const savedResult = localStorage.getItem("buddyLatestBmiResult");
    const savedForm = localStorage.getItem("buddyLatestBmiForm");

    if (savedResult) {
      setResult(JSON.parse(savedResult));
      setShowForm(false);
    }

    if (savedForm) {
      setForm(JSON.parse(savedForm));
    }
  }, []);

  const updateField = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const calculateMetrics = async (e) => {
    e.preventDefault();

    const height = Number(form.height);
    const weight = Number(form.weight);

    const heightM = height / 100;
    const bmi = Number((weight / (heightM * heightM)).toFixed(1));
    const category = getBmiCategory(bmi);

    const bodyFat = calculateBodyFat(form);

    const musclePercentage = bodyFat
      ? Number((100 - bodyFat - 15).toFixed(1))
      : null;

    const calories = calculateCalories(form);

    const finalResult = {
      bmi,
      category,
      calories,
      bodyFat,
      musclePercentage,
      suggestion: getSuggestion(bmi, bodyFat),
      calculatedAt: new Date().toISOString(),
    };

    setResult(finalResult);
    setShowForm(false);

    localStorage.setItem("buddyLatestBmiResult", JSON.stringify(finalResult));
    localStorage.setItem("buddyLatestBmiForm", JSON.stringify(form));

    try {
      setSaving(true);

      await api.post("/user/bmi", {
        height,
        weight,
        bmi,
        category,
      });
    } catch (error) {
      console.error("Failed to save BMI:", error);
    } finally {
      setSaving(false);
    }
  };

  const editDetails = () => {
    setShowForm(true);
  };

  const clearResult = () => {
    localStorage.removeItem("buddyLatestBmiResult");
    setResult(null);
    setShowForm(true);
  };

  return (
    <div className="premium-bmi-page">
      <div className="premium-bmi-header">
        <p>Performance Hub</p>
        <h1>Body Metrics</h1>
        <span>BMI, calories, fat percentage and muscle estimate.</span>
      </div>

      {showForm && (
        <form className="premium-bmi-form" onSubmit={calculateMetrics}>
          <h2>Personal Data</h2>

          <div className="premium-form-grid">
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
                required
              />
            </label>

            <label>
              <span>Weight kg</span>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                required
              />
            </label>

            <label>
              <span>Height cm</span>
              <input
                type="number"
                value={form.height}
                onChange={(e) => updateField("height", e.target.value)}
                required
              />
            </label>

            <label>
              <span>Waist cm</span>
              <input
                type="number"
                value={form.waist}
                onChange={(e) => updateField("waist", e.target.value)}
              />
            </label>

            <label>
              <span>Neck cm</span>
              <input
                type="number"
                value={form.neck}
                onChange={(e) => updateField("neck", e.target.value)}
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
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="athlete">Athlete</option>
            </select>
          </label>

          <button>Calculate Metrics</button>
        </form>
      )}

      {!showForm && result && (
        <>
          <div className="metrics-grid">
            <div className="metric-premium-card highlight">
              <UserRound size={26} />
              <p>BMI</p>
              <h2>{result.bmi}</h2>
              <span>{result.category}</span>
            </div>

            <div className="metric-premium-card">
              <Flame size={26} />
              <p>Calorie</p>
              <h2>{result.calories}</h2>
              <span>kcal/day</span>
            </div>

            <div className="metric-premium-card">
              <Percent size={26} />
              <p>Fat %</p>
              <h2>{result.bodyFat || "--"}</h2>
              <span>{result.bodyFat ? "Estimated" : "Need waist/neck"}</span>
            </div>

            <div className="metric-premium-card">
              <Dumbbell size={26} />
              <p>Muscle %</p>
              <h2>{result.musclePercentage || "--"}</h2>
              <span>Estimated</span>
            </div>
          </div>

          <div className="premium-suggestion-card">
            <div>
              <Activity size={30} />
              <h3>Suggestion</h3>
            </div>

            <p>{result.suggestion}</p>

            <button onClick={() => navigate("/payment/personal-training")}>
              Take Personal Training
            </button>

            <button className="edit-bmi-btn" onClick={editDetails}>
              Edit Details
            </button>

            <button className="edit-bmi-btn" onClick={clearResult}>
              Clear Result
            </button>

            {saving && <small>Saving BMI record...</small>}
          </div>
        </>
      )}
    </div>
  );
}

export default BMI;