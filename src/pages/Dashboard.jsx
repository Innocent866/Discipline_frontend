import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const Dashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ students: 0, cases: 0, pending: 0 });
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [studentsRes, casesRes] = await Promise.all([
          apiFetch("/api/students", { token }),
          apiFetch("/api/cases", { token }),
        ]);
        const pending = casesRes.data.filter((c) => c.status === "pending").length;
        setStats({
          students: studentsRes.count || studentsRes.data.length,
          cases: casesRes.data.length,
          pending,
        });
        setRecentCases(casesRes.data.slice(0, 5));
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [token]);

  return (
    <>
      <h1>Welcome, {user?.fullName}</h1>
      <div className="toolbar">
        <div className="pill admin" style={{ textTransform: "capitalize" }}>
          Role: {user?.role}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="card">
          <h3>Students</h3>
          <strong style={{ fontSize: 32 }}>{stats.students}</strong>
        </div>
        <div className="card">
          <h3>Cases</h3>
          <strong style={{ fontSize: 32 }}>{stats.cases}</strong>
        </div>
        <div className="card">
          <h3>Pending Cases</h3>
          <strong style={{ fontSize: 32 }}>{stats.pending}</strong>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="toolbar">
          <h3>Recent Cases</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Offense</th>
              <th>Status</th>
              <th>Reporter</th>
            </tr>
          </thead>
          <tbody>
            {recentCases.map((c) => (
              <tr key={c._id}>
                <td>{c.student?.firstName} {c.student?.lastName}</td>
                <td>{c.offenseType?.name}</td>
                <td>
                  <span className={`pill ${c.status}`}>{c.status}</span>
                </td>
                <td>{c.reporter?.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Dashboard;

