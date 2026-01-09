import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./StudentProfilePage.css";

const StudentProfilePage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  
  const [student, setStudent] = useState(null);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Student Details
        const studentRes = await apiFetch(`/api/students/${id}`, { token });
        setStudent(studentRes.data);

        // Fetch All Cases and Filter (Backend doesn't support specific filtering yet)
        const casesRes = await apiFetch("/api/cases", { token });
        // Filter cases where student ID matches
        const studentCases = (casesRes.data || []).filter(
            (c) => c.student && (c.student._id === id || c.student === id)
        );
        setCases(studentCases);
      } catch (err) {
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, token]);

  // Calculate Stats
  const totalPoints = useMemo(() => {
    return cases.reduce((acc, c) => acc + (c.offenseType?.pointValue || 0), 0);
  }, [cases]);

  const activePunishments = useMemo(() => {
      // Logic for active punishments could be complex, for now just counting unresolved cases
      return cases.filter(c => !c.isResolved && c.status === "approved").length;
  }, [cases]);


  if (loading) return <div className="p-10 text-center">Loading Profile...</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!student) return <div className="p-10 text-center">Student not found</div>;

  return (
    <div className="profile-page">
      <Link to="/students" className="back-link">
        ← Back to Students
      </Link>

      <div className="profile-header-card">
        <div className="profile-avatar-large">
          {student.fullName ? student.fullName.charAt(0).toUpperCase() : "?"}
        </div>
        <div className="profile-info">
          <h1>{student.fullName}</h1>
          <div className="profile-details">
            <div className="detail-item">
              <span>📧</span> {student.email || "No Email"}
            </div>
             <div className="detail-item">
              <span>🆔</span> {student.studentId || "N/A"}
            </div>
             <div className="detail-item">
              <span>🏫</span> Class: {student.class || "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Points</div>
          <div className={`stat-value ${totalPoints > 20 ? 'danger' : totalPoints > 10 ? 'warning' : 'success'}`}>
            {totalPoints}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cases</div>
          <div className="stat-value">{cases.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Punishments</div>
          <div className="stat-value warning">{activePunishments}</div>
        </div>
      </div>

      <div className="cases-section">
        <h2>Disciplinary History</h2>
        <div className="profile-table-container">
          <table className="profile-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Offense</th>
                <th>Points</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c._id}>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td>
                    <strong>{c.offenseType?.name || "Unknown Offense"}</strong>
                    {c.offenseType?.description && (
                        <div style={{fontSize: 12, color: "#64748b"}}>{c.offenseType.description}</div>
                    )}
                  </td>
                  <td>
                    <span style={{fontWeight: 600, color: "#ef4444"}}>
                        +{c.offenseType?.pointValue || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${c.status}`}>
                      {c.isResolved ? "Resolved" : c.status}
                    </span>
                  </td>
                  <td style={{color: "#64748b", fontSize: 13}}>
                      {c.description ? `"${c.description}"` : "-"}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={5} style={{textAlign: "center", padding: 32, color: "#94a3b8"}}>
                    No disciplinary records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
