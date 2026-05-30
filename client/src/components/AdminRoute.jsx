import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const token = localStorage.getItem("buddyToken");
  const user = JSON.parse(localStorage.getItem("buddyUser") || "{}");

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default AdminRoute;