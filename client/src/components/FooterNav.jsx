import { NavLink } from "react-router-dom";
import {
  Home,
  Calculator,
  Utensils,
  ShoppingBag,
  User,
} from "lucide-react";

const navItems = [
  {
    path: "/workouts",
    label: "Home",
    Icon: Home,
  },
  {
    path: "/bmi",
    label: "BMI",
    Icon: Calculator,
  },
  {
    path: "/diet",
    label: "Food",
    Icon: Utensils,
  },
  {
    path: "/store",
    label: "Store",
    Icon: ShoppingBag,
  },
  {
    path: "/profile",
    label: "Profile",
    Icon: User,
  },
];

function FooterNav() {
  return (
    <nav className="footer-nav">
      {navItems.map(({ path, label, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            isActive ? "footer-nav-item active" : "footer-nav-item"
          }
        >
          <Icon size={25} strokeWidth={2.2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default FooterNav;