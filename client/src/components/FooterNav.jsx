import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Utensils, TrendingUp, User } from "lucide-react";

function FooterNav() {
  return (
    <nav className="elite-footer-nav five">
      <NavLink to="/workouts">
        <Home size={25} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/bmi">
        <Dumbbell size={25} />
        <span>BMI</span>
      </NavLink>

      <NavLink to="/diet">
        <Utensils size={25} />
        <span>Food</span>
      </NavLink>

      <NavLink to="/weight">
        <TrendingUp size={25} />
        <span>Track</span>
      </NavLink>

      <NavLink to="/profile">
        <User size={25} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

export default FooterNav;