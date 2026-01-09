import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./Dashboard.css";

const Dashboard = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ students: 0, cases: 0, pending: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [studentsRes, casesRes] = await Promise.all([
          apiFetch("/api/students", { token }),
          apiFetch("/api/cases", { token }),
        ]);

        const allCases = casesRes.data || [];
        const pending = allCases.filter((c) => c.status === "pending").length;

        setStats({
          students: studentsRes.count || (studentsRes.data || []).length,
          cases: allCases.length,
          pending,
        });

        // Sort by date desc and take top 5
        const sortedCases = [...allCases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentCases(sortedCases.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const getTimeAgo = (date) => {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return "Just now";
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.fullName}</h1>
        <p>Here's what's happening in the Discipline Committee today.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon students">👥</div>
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{stats.students}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cases">📂</div>
          <div className="stat-label">Total Cases</div>
          <div className="stat-value">{stats.cases}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⚠️</div>
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Activity */}
        <div className="section-card">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/cases" className="view-all-link">View All</Link>
          </div>
          <table className="activity-table">
            <tbody>
              {recentCases.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="activity-user">{c.student?.firstName} {c.student?.lastName}</div>
                    <div className="activity-sub">ID: {c.student?.studentId}</div>
                  </td>
                  <td>
                    <div style={{fontWeight: 500}}>{c.offenseType?.name}</div>
                    <div className="activity-sub">{getTimeAgo(c.createdAt)}</div>
                  </td>
                  <td style={{textAlign: "right"}}>
                    <span className={`status-pill ${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {recentCases.length === 0 && !loading && (
                  <tr><td colSpan={3} style={{textAlign: "center", color: "#94a3b8"}}>No recent activity</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="section-card">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-grid">
            <button className="action-btn-large" onClick={() => navigate("/cases")}>
              <div className="action-icon">📝</div>
              <div className="action-info">
                <div>Report a Case</div>
                <div>File a new disciplinary report</div>
              </div>
            </button>
            <button className="action-btn-large" onClick={() => navigate("/students")}>
              <div className="action-icon">🎓</div>
              <div className="action-info">
                <div>Manage Students</div>
                <div>Add or edit student profiles</div>
              </div>
            </button>
             {user.role === "admin" && (
                <button className="action-btn-large" onClick={() => navigate("/offense-types")}>
                <div className="action-icon">⚖️</div>
                <div className="action-info">
                    <div>Offense Types</div>
                    <div>Manage rules and points</div>
                </div>
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
