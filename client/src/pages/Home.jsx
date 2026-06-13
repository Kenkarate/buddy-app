import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/api";
import { normalizePlan, routeAfterPlanSelection } from "../utils/planAccess";

function Home() {
  const navigate = useNavigate();
  const [loadingProgram, setLoadingProgram] = useState("");

 const chooseProgram = async (program) => {
  const normalizedProgram = normalizePlan(program);
  localStorage.setItem("buddyPendingProgram", normalizedProgram);

  const token = localStorage.getItem("buddyToken");

  if (!token) {
    navigate("/login");
    return;
  }

  try {
    setLoadingProgram(normalizedProgram);
    await routeAfterPlanSelection({
      api,
      navigate,
      program: normalizedProgram,
    });
  } catch (error) {
    navigate(`/payment/${normalizedProgram}`);
  } finally {
    setLoadingProgram("");
  }
};

  return (
    <div className="home-screen">
      <div className="app-topbar">
        <div className="logo-text">
          <span>B</span>uddy
        </div>
      </div>

      <div className="hero-card">
        <p className="eyebrow">Start Training</p>
        <h1>Choose Your Workout Plan</h1>
        <p className="muted">
          Choose your plan and start training.. Workouts, diet, BMI and progress tracking.
        </p>
      </div>

      <div className="program-list">
        <button
          className="program-card personal"
          disabled={Boolean(loadingProgram)}
          onClick={() => chooseProgram("personal-training")}
        >
          <div>
            <h3>Personal Training</h3>
            <p>
              {loadingProgram === "personal-training"
                ? "Checking your plan..."
                : "Trainer-assigned workout and diet plan."}
            </p>
          </div>
        </button>

        <button
          className="program-card normal"
          disabled={Boolean(loadingProgram)}
          onClick={() => chooseProgram("normal-workouts")}
        >
          <div>
            <h3>Normal Workouts</h3>
            <p>
              {loadingProgram === "normal-workouts"
                ? "Checking your plan..."
                : "Gym-based structured training plan."}
            </p>
          </div>
        </button>

        <button
          className="program-card home"
          disabled={Boolean(loadingProgram)}
          onClick={() => chooseProgram("home-workout")}
        >
          <div>
            <h3>Home Workout</h3>
            <p>
              {loadingProgram === "home-workout"
                ? "Checking your plan..."
                : "Train from home with simple routines."}
            </p>
          </div>
        </button>
      </div>

      <button className="secondary-btn" onClick={() => navigate("/login")}>
        Login
      </button>

      <button className="admin-link" onClick={() => navigate("/admin-login")}>
        Trainer Login
      </button>
    </div>
  );
}

export default Home;
