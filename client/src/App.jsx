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
import AdminDailyWorkout from "./pages/AdminDailyWorkout";
import AdminWeeklyWorkout from "./pages/AdminWeeklyWorkout";
import AdminUsers from "./pages/AdminUsers";
import AdminDiet from "./pages/AdminDiet";

import FooterNav from "./components/FooterNav";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RouteLoader from "./components/RouteLoader";

import HomeWorkoutSetup from "./pages/HomeWorkoutSetup";
import DummyRazorpay from "./pages/DummyRazorpay";

import WorkoutList from "./pages/WorkoutList";
import WorkoutDetail from "./pages/WorkoutDetail";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";

import { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal from "./components/ShareModal";
import DailyWorkout from "./pages/DailyWorkout";

function UserLayout({ children }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="mobile-shell">
      <main className="page-content">
        <div className="app-topbar centered-logo-topbar">
          <div className="topbar-spacer" />

          <img
            src="/icons/logo.jpeg"
            alt="Buddy Logo"
            className="center-app-logo"
          />

          <button
            className="top-share-btn"
            onClick={() => setShareOpen(true)}
            aria-label="Share Buddy"
          >
            <Share2 size={22} />
          </button>
        </div>

        {children}
      </main>

      <FooterNav />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <RouteLoader />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/home-workout-setup" element={<HomeWorkoutSetup />} />

<Route path="/razorpay/:program" element={<DummyRazorpay />} />
<Route path="/coming-soon" element={<ComingSoon />} />

        <Route path="/payment/:program" element={<Payment />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
  path="/daily-workout"
  element={
    <ProtectedRoute>
      <UserLayout>
        <DailyWorkout />
      </UserLayout>
    </ProtectedRoute>
  }
/>

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
        <Route
          path="/admin/daily-workout"
          element={
            <AdminRoute>
              <AdminDailyWorkout />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/weekly-workout"
          element={
            <AdminRoute>
              <AdminWeeklyWorkout />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/diet"
          element={
            <AdminRoute>
              <AdminDiet />
            </AdminRoute>
          }
        />
        <Route
  path="/workout-list/:part"
  element={
    <ProtectedRoute>
      <UserLayout>
        <WorkoutList />
      </UserLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/workout-detail/:part/:id"
  element={
    <ProtectedRoute>
      <UserLayout>
        <WorkoutDetail />
      </UserLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/store"
  element={
    <ProtectedRoute>
      <UserLayout>
        <Store />
      </UserLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/product/:id"
  element={
    <ProtectedRoute>
      <UserLayout>
        <ProductDetail />
      </UserLayout>
    </ProtectedRoute>
  }
/>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
