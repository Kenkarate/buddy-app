import { Navigate } from "react-router-dom";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("buddyUser") || "{}");
  } catch {
    localStorage.removeItem("buddyUser");
    return {};
  }
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("buddyToken");
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default AdminRoute;
