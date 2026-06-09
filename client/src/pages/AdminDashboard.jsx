import { useEffect, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Eye,
  TrendingUp,
  Users,
} from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../api/api";

const statConfig = [
  ["totalUsers", "Total Users", Users],
  ["activeUsers", "Active Users", Activity],
  ["paidUsers", "Paid Users", CreditCard],
  ["freeUsers", "Free Users", Users],
  ["totalWorkouts", "Workouts", Dumbbell],
  ["totalAssignedDailyWorkouts", "Daily Plans", CalendarCheck],
  ["totalAssignedWeeklyWorkouts", "Weekly Plans", CalendarCheck],
  ["workoutsCheckedByUsers", "Checked", TrendingUp],
  ["workoutViews", "Views", Eye],
  ["newUsersThisWeek", "New This Week", Users],
];

function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [topWorkouts, setTopWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError("");
        const [summaryRes, activityRes, topRes] = await Promise.all([
          api.get("/admin/analytics/summary"),
          api.get("/admin/analytics/recent-activity"),
          api.get("/admin/analytics/top-workouts"),
        ]);

        setSummary(summaryRes.data || {});
        setActivity(activityRes.data.activity || []);
        setTopWorkouts(topRes.data.workouts || []);
      } catch (loadError) {
        console.error("Admin analytics error:", loadError);
        setError("Could not load analytics. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <AdminShell title="Dashboard">
      {error && <div className="admin-notice error">{error}</div>}

      {loading ? (
        <div className="skeleton-grid admin-skeleton-grid">
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : (
        <>
          <section className="admin-stat-grid">
            {statConfig.map(([key, label, Icon]) => (
              <div className="admin-stat-tile" key={key}>
                <Icon size={22} />
                <strong>{summary?.[key] ?? 0}</strong>
                <span>{label}</span>
              </div>
            ))}
          </section>

          <section className="admin-panel-card">
            <div className="admin-section-head">
              <p>Highlights</p>
              <h2>Performance</h2>
            </div>
            <div className="admin-progress-list">
              <div>
                <span>Most used category</span>
                <strong>{summary?.mostUsedWorkoutCategory || "Not available"}</strong>
              </div>
              <div>
                <span>Payments this month</span>
                <strong>{summary?.paymentsThisMonth || 0}</strong>
              </div>
            </div>
          </section>

          <section className="admin-panel-card">
            <div className="admin-section-head">
              <p>Top Workouts</p>
              <h2>Most Viewed</h2>
            </div>
            {topWorkouts.length === 0 ? (
              <div className="admin-empty-box">No workout events yet.</div>
            ) : (
              <div className="admin-progress-list">
                {topWorkouts.map((workout) => (
                  <div key={workout.name}>
                    <span>{workout.name}</span>
                    <strong>{workout.views} views · {workout.completions} checked</strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-panel-card">
            <div className="admin-section-head">
              <p>Live Feed</p>
              <h2>Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <div className="admin-empty-box">Activity will appear once users interact.</div>
            ) : (
              <div className="admin-activity-list">
                {activity.map((item) => (
                  <article key={`${item.type}-${item.id}`}>
                    <span />
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {item.detail} · {new Date(item.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}

export default AdminDashboard;
