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


  const handleApprove = async (caseId) => {
    if (!window.confirm("Approve this case?")) return;
    try {
      await apiFetch(`/api/cases/${caseId}/approve`, { token, method: "PUT" });
      setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: "approved" } : c));
    } catch (err) {
      alert("Failed to approve case");
    }
  };

  const handleResolve = async (caseId) => {
    const notes = window.prompt("Enter resolution notes (optional):");
    if (notes === null) return;
    try {
      await apiFetch(`/api/cases/${caseId}/resolve`, { 
        token, 
        method: "POST", 
        body: { resolutionNotes: notes }
      });
      setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: "resolved", isResolved: true } : c));
    } catch (err) {
      alert("Failed to resolve case");
    }
  };

  const handleUnapprove = async (caseId) => {
    if (!window.confirm("Unapprove this case (revert to default pending)?")) return;
    try {
       await apiFetch(`/api/cases/${caseId}/unapprove`, { token, method: "PUT" });
       setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: "pending" } : c));
    } catch (err) {
        alert("Failed to unapprove case");
    }
  };

  const handleUnresolve = async (caseId) => {
    if (!window.confirm("Unresolve this case (revert to approved)?")) return;
    try {
       await apiFetch(`/api/cases/${caseId}/unresolve`, { token, method: "PUT" });
       setCases(prev => prev.map(c => c._id === caseId ? { ...c, status: "approved", isResolved: false, resolutionNotes: undefined } : c));
    } catch (err) {
        alert("Failed to unresolve case");
    }
  };

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
                <th>Punishment</th>
                <th>Points</th>
                <th>Status</th>
                <th>Details</th>
                <th>Action</th>
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
                    {c.suggestedPunishment ? (
                         <span style={{color: "#e11d48", fontWeight: 500}}>
                             {c.suggestedPunishment.name}
                         </span>
                    ) : <span style={{color: "#94a3b8"}}>-</span>}
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
                  <td>
                    {!c.isResolved && (
                        <div style={{display: "flex", gap: 8, fontSize: 12}}>
                            {c.status === "pending" && (
                                <button
                                    onClick={() => handleApprove(c._id)}
                                    className="btn-secondary"
                                    style={{padding: "4px 8px"}}
                                >
                                    Approve
                                </button>
                            )}
                            {c.status === "approved" && (
                                <span
                                    onClick={() => handleResolve(c._id)}
                                    style={{cursor: "pointer", color: "#16a34a", fontWeight: 600, textDecoration: "underline"}}
                                >
                                    Resolve
                                </span>
                            )}
                            {c.status === "approved" && (
                                 <span
                                    onClick={() => handleUnapprove(c._id)}
                                    style={{cursor: "pointer", color: "#64748b", fontWeight: 500, fontSize: 11, textDecoration: "underline"}}
                                >
                                    Unapprove
                                </span>
                            )}
                        </div>
                    )}
                    {c.isResolved && (
                         <span
                            onClick={() => handleUnresolve(c._id)}
                            style={{cursor: "pointer", color: "#64748b", fontWeight: 500, fontSize: 11, textDecoration: "underline"}}
                        >
                            Unresolve
                        </span>
                    )}
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
