import { NavLink } from "react-router-dom";
import { BarChart3, CalendarDays, LogOut, Users, View } from "lucide-react";

const adminTabs = [
  { path: "/admin", label: "Dashboard", Icon: BarChart3, end: true },
  { path: "/admin/daily-workout", label: "Daily", Icon: CalendarDays },
  { path: "/admin/weekly-workout", label: "Weekly", Icon: View },
  { path: "/admin/users", label: "Users", Icon: Users },
];

function AdminShell({ title, eyebrow = "Trainer Panel", children }) {
  const logout = () => {
    localStorage.removeItem("buddyToken");
    localStorage.removeItem("buddyUser");
    window.location.href = "/admin-login";
  };

  return (
    <div className="admin-mobile-shell">
      <header className="admin-mobile-header">
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </div>

        <button type="button" onClick={logout} aria-label="Logout">
          <LogOut size={20} />
        </button>
      </header>

      <main className="admin-mobile-content">{children}</main>

      <nav className="admin-footer-nav">
        {adminTabs.map(({ path, label, Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) =>
              isActive ? "admin-footer-item active" : "admin-footer-item"
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default AdminShell;
