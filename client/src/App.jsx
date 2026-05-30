import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import "./App.css";

import Home from "./pages/Home";
import Payment from "./pages/Payment";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import UserWorkout from "./pages/UserWorkout";
import UserDiet from "./pages/UserDiet";
import BMI from "./pages/BMI";
import Weight from "./pages/Weight";
import Profile from "./pages/Profile";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

import FooterNav from "./components/FooterNav";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function UserLayout({ children }) {
  return (
    <div className="mobile-shell">
      <main className="page-content">
        {window.location.pathname !== "/profile" && (
  <div className="elite-topbar">
    <div className="elite-brand">
      <div className="elite-avatar" />
      <span>Buddy</span>
    </div>

    <div className="elite-bell">
      <Dumbbell size={22} />
    </div>
  </div>
)}

        {children}
      </main>

      <FooterNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/payment/:program" element={<Payment />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/workouts"
          element={
            <ProtectedRoute>
              <UserLayout>
                <UserWorkout />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/diet"
          element={
            <ProtectedRoute>
              <UserLayout>
                <UserDiet />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bmi"
          element={
            <ProtectedRoute>
              <UserLayout>
                <BMI />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/weight"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Weight />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserLayout>
                <Profile />
              </UserLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;