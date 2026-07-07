"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import api from "@/lib/api";

const statusOptions = ["open", "in-progress", "closed"];

function AdminSupport() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/contact");
        setIssues(res.data || []);
      } catch (loadError) {
        console.error("Admin support error:", loadError);
        setError("Could not load support submissions.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/contact/${id}`, { status });
      setIssues((prev) =>
        prev.map((issue) => (issue._id === id ? res.data : issue))
      );
    } catch (updateError) {
      console.error("Admin support status update error:", updateError);
      setError("Could not update status. Please try again.");
    }
  };

  const totals = {
    total: issues.length,
    open: issues.filter((issue) => issue.status === "open").length,
    inProgress: issues.filter((issue) => issue.status === "in-progress").length,
    closed: issues.filter((issue) => issue.status === "closed").length,
  };

  return (
    <AdminShell title="Support">
      {error && (
        <div className="admin-notice error">
          <span>{error}</span>
          <button
            type="button"
            className="admin-notice-dismiss"
            onClick={() => setError("")}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="admin-stat-grid compact">
        <div className="admin-stat-tile">
          <strong>{totals.total}</strong>
          <span>Total</span>
        </div>
        <div className="admin-stat-tile">
          <strong>{totals.open}</strong>
          <span>Open</span>
        </div>
        <div className="admin-stat-tile">
          <strong>{totals.inProgress}</strong>
          <span>In Progress</span>
        </div>
      </section>

      {loading ? (
        <div className="skeleton-grid">
          <span />
          <span />
        </div>
      ) : issues.length === 0 ? (
        <div className="admin-empty-box">No support submissions yet.</div>
      ) : (
        <div className="admin-support-list">
          {issues.map((issue) => (
            <article key={issue._id}>
              <div className="admin-support-head">
                <span className="admin-support-type">{issue.type}</span>
                <select
                  value={issue.status}
                  onChange={(event) => updateStatus(issue._id, event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "in-progress" ? "In Progress" : option === "open" ? "Open" : "Closed"}
                    </option>
                  ))}
                </select>
              </div>

              <strong>{issue.subject}</strong>
              <p>{issue.message}</p>

              {issue.type === "Trainer Partnership" && (
                <small>
                  {issue.trainerBusinessName} · {issue.experience}
                  {issue.phone ? ` · ${issue.phone}` : ""}
                </small>
              )}

              <small>
                {issue.email} · {new Date(issue.createdAt).toLocaleString()}
              </small>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

export default AdminSupport;
