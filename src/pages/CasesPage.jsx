import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./CasesPage.css";

const empty = {
  student: "",
  offenseType: "",
  description: "",
  eventDate: "",
  location: "",
  suggestedPunishment: "",
};

const CasesPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [offenses, setOffenses] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [form, setForm] = useState(empty);
  
  // UI State
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [casesRes, studentsRes, offenseRes, punishRes] = await Promise.all([
        apiFetch("/api/cases", { token }),
        apiFetch("/api/students", { token }),
        apiFetch("/api/offense-types", { token }),
        apiFetch("/api/punishments", { token }),
      ]);
      setCases(casesRes.data || []);
      setStudents(studentsRes.data || []);
      setOffenses(offenseRes.data || []);
      setPunishments(punishRes.data || []);
    } catch (err) {
      addToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = () => {
    setForm(empty);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(empty);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      await apiFetch("/api/cases", { token, method: "POST", body: form });
      addToast("Case reported successfully");
      closeModal();
      load();
    } catch (err) {
      addToast("Operation failed", "error");
    }
  };

  // Group cases by student
  const groupedData = useMemo(() => {
    const groups = {};
    
    cases.forEach(c => {
        const studentId = c.student?._id || c.student; // Handle populated or unpopulated
        if (!studentId) return;

        if (!groups[studentId]) {
            // Initialize group with student info (find from students list to ensure full details)
            const studentDetails = students.find(s => s._id === studentId) || c.student;
            groups[studentId] = {
                student: studentDetails || { _id: studentId, firstName: "Unknown", lastName: "Student" },
                totalCases: 0,
                pendingCases: 0,
                totalPoints: 0,
                latestCase: null
            };
        }
        
        const group = groups[studentId];
        group.totalCases++;
        if (c.status === "pending") group.pendingCases++;
        group.totalPoints += (c.offenseType?.pointValue || 0);

        // Track latest case
        const caseDate = new Date(c.createdAt);
        if (!group.latestCase || caseDate > new Date(group.latestCase.createdAt)) {
            group.latestCase = c;
        }
    });

    return Object.values(groups);
  }, [cases, students]);

  const filteredGroups = useMemo(() => {
      return groupedData.filter(g => {
          const text = `${g.student?.firstName} ${g.student?.lastName} ${g.student?.studentId}`.toLowerCase();
          return text.includes(filter.toLowerCase());
      });
  }, [groupedData, filter]);

  return (
    <div className="cases-page">
      <div className="cases-header">
        <h1>Overview</h1>
        <div className="cases-toolbar">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search students..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={openModal}>
            + Report New Case
          </button>
        </div>
      </div>

      <div className="cases-table-container">
        {loading && <div style={{padding: 20, textAlign: "center", color: "#64748b"}}>Loading overview...</div>}
        {!loading && (
          <table className="cases-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Total Cases</th>
                <th>Status</th>
                <th>Latest Offense</th>
                <th style={{textAlign: "right"}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => (
                <tr key={g.student._id} className="group-row" onClick={() => navigate(`/students/${g.student._id}`)} style={{cursor: "pointer"}}>
                  <td>
                    <div style={{fontWeight: 600, color: "#0f172a"}}>
                        {g.student.firstName} {g.student.lastName}
                    </div>
                    <div style={{fontSize: 12, color: "#64748b"}}>ID: {g.student.studentId}</div>
                  </td>
                  <td>
                    <div style={{fontWeight: 600, fontSize: 16}}>{g.totalCases}</div>
                    <div style={{fontSize: 12, color: "#64748b"}}>{g.totalPoints} pts total</div>
                  </td>
                  <td>
                    {g.pendingCases > 0 ? (
                        <span className="status-pill pending">{g.pendingCases} Pending</span>
                    ) : (
                        <span className="status-pill resolved">All Resolved</span>
                    )}
                  </td>
                  <td>
                    {g.latestCase ? (
                        <div>
                            <span style={{fontWeight: 500}}>{g.latestCase.offenseType?.name || "Unknown"}</span>
                            <div style={{fontSize: 12, color: "#94a3b8"}}>
                                {new Date(g.latestCase.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    ) : "-"}
                  </td>
                  <td style={{textAlign: "right"}}>
                     <button className="btn-secondary" style={{fontSize: 12, padding: "6px 12px"}}>
                        View Profile →
                     </button>
                  </td>
                </tr>
              ))}
              {filteredGroups.length === 0 && !loading && (
                  <tr>
                      <td colSpan={5} style={{padding: 40, textAlign: "center", color: "#94a3b8"}}>
                          No active cases found.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal - Keeps functionality to ADD cases */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report New Case</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Student</label>
                  <select
                    required
                    value={form.student}
                    onChange={(e) => setForm({ ...form, student: e.target.value })}
                  >
                    <option value="">Select student...</option>
                    {students
                        .filter((s, index, self) => index === self.findIndex((t) => t._id === s._id))
                        .map((s) => (
                      <option value={s._id} key={s._id}>
                        {s.firstName} {s.lastName} ({s.studentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Offense Type</label>
                  <select
                    required
                    value={form.offenseType}
                    onChange={(e) => setForm({ ...form, offenseType: e.target.value })}
                  >
                    <option value="">Select offense...</option>
                    {offenses.map((o) => (
                      <option value={o._id} key={o._id}>
                        {o.name} ({o.pointValue} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                    <label>Date & Location</label>
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
                        <input
                            type="date"
                            required
                            value={form.eventDate}
                            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                        />
                        <input
                            placeholder="Location (e.g. Classroom)"
                            value={form.location}
                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what happened..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Suggested Punishment (Optional)</label>
                  <select
                    value={form.suggestedPunishment}
                    onChange={(e) => setForm({ ...form, suggestedPunishment: e.target.value })}
                  >
                    <option value="">None</option>
                    {punishments.map((p) => (
                      <option value={p._id} key={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                    Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === "success" ? "✓" : "⚠"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CasesPage;
