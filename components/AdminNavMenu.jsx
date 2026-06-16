"use client";

import { useEffect, useState } from "react";
import { NavLink } from "@/lib/navigation";
import {
  CalendarDays,
  Headphones,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Salad,
  Settings,
  Users,
  View,
  X,
} from "lucide-react";

// Single source of truth for the admin navigation, shared by both admin shells.
const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/daily-workout", label: "Daily Workout", icon: CalendarDays },
  { to: "/admin/weekly-workout", label: "Weekly Workout", icon: View },
  { to: "/admin/home-workout", label: "Home Workout", icon: House },
  { to: "/admin/diet", label: "Diet", icon: Salad },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/support", label: "Support", icon: Headphones },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

// Top-right hamburger menu used in place of the old fixed footer nav.
function AdminNavMenu() {
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("buddyToken");
    localStorage.removeItem("buddyUser");
    window.location.href = "/admin-login";
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-nav">
      <button
        type="button"
        className="admin-nav-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="admin-nav-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          <div className="admin-nav-menu" role="menu">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? "admin-nav-item active" : "admin-nav-item"
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}

            <button type="button" className="admin-nav-item admin-nav-logout" onClick={logout}>
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminNavMenu;
