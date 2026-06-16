import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Share2 } from "lucide-react";
import "./App.css";

import Home from "./pages/Home";

import FooterNav from "./components/FooterNav";
import ProtectedRoute from "./components/ProtectedRoute";
import PlanRoute from "./components/PlanRoute";
import AdminRoute from "./components/AdminRoute";
import RouteLoader from "./components/RouteLoader";
import PageLoader from "./components/PageLoader";
import ShareModal from "./components/ShareModal";

const Payment = lazy(() => import("./pages/Payment"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const UserWorkout = lazy(() => import("./pages/UserWorkout"));
const UserDiet = lazy(() => import("./pages/UserDiet"));
const BMI = lazy(() => import("./pages/BMI"));
const Weight = lazy(() => import("./pages/Weight"));
const Profile = lazy(() => import("./pages/Profile"));

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDailyWorkout = lazy(() => import("./pages/AdminDailyWorkout"));
const AdminWeeklyWorkout = lazy(() => import("./pages/AdminWeeklyWorkout"));
const AdminHomeWorkout = lazy(() => import("./pages/AdminHomeWorkout"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminDiet = lazy(() => import("./pages/AdminDiet"));
const AdminSupport = lazy(() => import("./pages/AdminSupport"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

const DummyRazorpay = lazy(() => import("./pages/DummyRazorpay"));

const WorkoutList = lazy(() => import("./pages/WorkoutList"));
const WorkoutDetail = lazy(() => import("./pages/WorkoutDetail"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const NotFound = lazy(() => import("./pages/NotFound"));

const Store = lazy(() => import("./pages/Store"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

const DailyWorkout = lazy(() => import("./pages/DailyWorkout"));

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
  useEffect(() => {
    const savedTheme = localStorage.getItem("buddyTheme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <BrowserRouter>
      <RouteLoader />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />

<Route
  path="/razorpay/:program"
  element={
    <ProtectedRoute>
      <DummyRazorpay />
    </ProtectedRoute>
  }
/>
<Route path="/coming-soon" element={<ComingSoon />} />

        <Route
          path="/payment/:program"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
  path="/daily-workout"
  element={
    <PlanRoute anyPlans={["normal-workouts", "home-workout"]}>
      <UserLayout>
        <DailyWorkout />
      </UserLayout>
    </PlanRoute>
  }
/>

        <Route
          path="/workouts"
          element={
            <PlanRoute anyPlans={["normal-workouts", "home-workout"]}>
              <UserLayout>
                <UserWorkout />
              </UserLayout>
            </PlanRoute>
          }
        />

        <Route
          path="/normal-workout"
          element={
            <PlanRoute plan="normal-workouts">
              <UserLayout>
                <UserWorkout routePlan="normal-workouts" />
              </UserLayout>
            </PlanRoute>
          }
        />

        <Route
          path="/home-workout"
          element={
            <PlanRoute plan="home-workout">
              <UserLayout>
                <UserWorkout routePlan="home-workout" />
              </UserLayout>
            </PlanRoute>
          }
        />

        <Route
          path="/personal-training"
          element={
            <PlanRoute plan="personal-training">
              <UserLayout>
                <ComingSoon />
              </UserLayout>
            </PlanRoute>
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
          path="/admin/home-workout"
          element={
            <AdminRoute>
              <AdminHomeWorkout />
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
          path="/admin/support"
          element={
            <AdminRoute>
              <AdminSupport />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
<Route
  path="/workout-list/:part"
  element={
    <PlanRoute plan="normal-workouts">
      <UserLayout>
        <WorkoutList />
      </UserLayout>
    </PlanRoute>
  }
/>

<Route
  path="/workout-detail/:part/:id"
  element={
    <PlanRoute anyPlans={["normal-workouts", "home-workout"]}>
      <UserLayout>
        <WorkoutDetail />
      </UserLayout>
    </PlanRoute>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
