import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

 const chooseProgram = (program) => {
  localStorage.setItem("buddySelectedProgram", program);

  if (program === "personal-training") {
    navigate("/coming-soon");
    return;
  }

  navigate(`/payment/${program}`);
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
          onClick={() => chooseProgram("personal-training")}
        >
          <div>
            <h3>Personal Training</h3>
            <p>Trainer-assigned workout and diet plan.</p>
          </div>
        </button>

        <button
          className="program-card normal"
          onClick={() => chooseProgram("normal-workouts")}
        >
          <div>
            <h3>Normal Workouts</h3>
            <p>Gym-based structured training plan.</p>
          </div>
        </button>

        <button
          className="program-card home"
          onClick={() => chooseProgram("home-workout")}
        >
          <div>
            <h3>Home Workout</h3>
            <p>Train from home with simple routines.</p>
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