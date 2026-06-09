import { useEffect, useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import AdminShell from "../components/AdminShell";
import api from "../api/api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/admin/users?q=${encodeURIComponent(search)}`);
        setUsers(res.data.users || []);
      } catch (loadError) {
        console.error("Admin users error:", loadError);
        setError("Could not load users.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const totals = useMemo(() => {
    const paid = users.filter((user) => user.subscriptionStatus === "paid").length;
    return { total: users.length, paid, free: users.length - paid };
  }, [users]);

  const openUser = async (user) => {
    setSelectedUser(user);
    setSelectedDetails(null);
    try {
      setDetailsLoading(true);
      const res = await api.get(`/admin/users/${user.id}`);
      setSelectedDetails(res.data);
    } catch (loadError) {
      console.error("User detail error:", loadError);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <AdminShell title="Users">
      {error && <div className="admin-notice error">{error}</div>}

      <section className="admin-stat-grid compact">
        <div className="admin-stat-tile">
          <strong>{totals.total}</strong>
          <span>Total</span>
        </div>
        <div className="admin-stat-tile">
          <strong>{totals.paid}</strong>
          <span>Paid</span>
        </div>
        <div className="admin-stat-tile">
          <strong>{totals.free}</strong>
          <span>Free</span>
        </div>
      </section>

      <label className="admin-search-box">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name or email"
        />
      </label>

      {loading ? (
        <div className="skeleton-grid">
          <span />
          <span />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty-box">No users found.</div>
      ) : (
        <div className="admin-user-list">
          {users.map((user) => (
            <button key={user.id} type="button" onClick={() => openUser(user)}>
              <UserRound size={24} />
              <div>
                <strong>{user.name || "Buddy User"}</strong>
                <span>{user.email}</span>
                <small>
                  {user.subscriptionStatus || "none"} · {user.workoutsViewed} views · {user.workoutsCompleted} checked
                </small>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="admin-bottom-sheet" role="dialog" aria-modal="true">
          <div className="admin-sheet-card">
            <button
              type="button"
              className="admin-sheet-close"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
            <h2>{selectedUser.name || "Buddy User"}</h2>
            <p>{selectedUser.email}</p>

            <div className="admin-progress-list">
              <div>
                <span>Payment</span>
                <strong>{selectedUser.subscriptionStatus || "none"}</strong>
              </div>
              <div>
                <span>Joined</span>
                <strong>{new Date(selectedUser.joinedDate).toLocaleDateString()}</strong>
              </div>
              <div>
                <span>Last active</span>
                <strong>{new Date(selectedUser.lastActiveDate).toLocaleDateString()}</strong>
              </div>
            </div>

            {detailsLoading ? (
              <div className="admin-empty-box">Loading history...</div>
            ) : (
              <div className="admin-activity-list">
                {(selectedDetails?.events || []).map((event) => (
                  <article key={event._id}>
                    <span />
                    <div>
                      <strong>{event.workoutName}</strong>
                      <small>{event.eventType} · {new Date(event.createdAt).toLocaleString()}</small>
                    </div>
                  </article>
                ))}
                {(selectedDetails?.events || []).length === 0 && (
                  <div className="admin-empty-box">No workout history yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

export default AdminUsers;
