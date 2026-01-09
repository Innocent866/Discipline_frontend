import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./StudentsPage.css";

const emptyForm = { firstName: "", lastName: "", studentId: "", className: "", status: "Day" };

const StudentsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  
  // UI State
  const [editingId, setEditingId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  
  const isAdmin = user?.role === "admin";

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
      const data = await apiFetch("/api/students", { token });
      setStudents(data.data);
    } catch (err) {
      addToast("Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (student = null) => {
    if (student) {
      setEditingId(student._id);
      setForm({
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        className: student.className,
        status: student.status,
      });
    } else {
      setEditingId("");
      setForm(emptyForm);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId("");
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      if (editingId) {
        await apiFetch(`/api/students/${editingId}`, { token, method: "PUT", body: form });
        addToast("Student updated successfully");
      } else {
        await apiFetch("/api/students", { token, method: "POST", body: form });
        addToast("Student added successfully");
      }
      closeModal();
      load();
    } catch (err) {
      addToast("Operation failed", "error");
    }
  };

  const deleteStudent = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await apiFetch(`/api/students/${id}`, { token, method: "DELETE" });
      addToast("Student deleted");
      load();
    } catch (err) {
      addToast("Failed to delete", "error");
    }
  };

  const filtered = useMemo(() => {
    return students.filter((s) => {
        const text = `${s.firstName} ${s.lastName} ${s.studentId} ${s.className}`.toLowerCase();
        return text.includes(filter.toLowerCase());
    });
  }, [students, filter]);

  const getInitials = (first, last) => {
      return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="students-page">
      <div className="students-header">
        <h1>Students</h1>
        <div className="students-toolbar">
           <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search students..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => openModal()}>
                + Add Student
            </button>
          )}
        </div>
      </div>

      <div className="students-table-container">
        {loading && <div style={{padding: 20, textAlign: "center", color: "#64748b"}}>Loading students...</div>}
        {!loading && (
            <table className="students-table">
            <thead>
                <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Status</th>
                {isAdmin && <th style={{textAlign: "right"}}>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {filtered.map((s) => (
                <tr key={s._id} onClick={() => navigate(`/students/${s._id}`)} style={{cursor: "pointer"}}>
                    <td>
                        <div className="student-cell">
                            <div className="student-avatar">{getInitials(s.firstName, s.lastName)}</div>
                            <div className="student-info">
                                <span className="student-name">{s.firstName} {s.lastName}</span>
                                <span className="student-id">ID: {s.studentId}</span>
                            </div>
                        </div>
                    </td>
                    <td>{s.className}</td>
                    <td>
                        <span className={`role-pill ${s.status === "Boarder" ? "admin" : ""}`}>
                            {s.status}
                        </span>
                    </td>
                    {isAdmin && (
                    <td style={{textAlign: "right"}} onClick={(e) => e.stopPropagation()}>
                        <button className="action-btn edit" title="Edit" onClick={() => openModal(s)}>✎</button>
                        <button className="action-btn delete" title="Delete" onClick={() => deleteStudent(s._id)}>🗑</button>
                    </td>
                    )}
                </tr>
                ))}
                {filtered.length === 0 && !loading && (
                    <tr>
                        <td colSpan={isAdmin ? 4 : 3} style={{padding: 40, textAlign: "center", color: "#94a3b8"}}>
                            No students found.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* Modal */}
      {showModal && isAdmin && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
              <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                        <div className="form-group">
                            <label>First Name</label>
                            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                        </div>
                    </div>
                
                    <div className="form-group">
                        <label>Student ID</label>
                        <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Class / Grade</label>
                        <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="Day">Day</option>
                            <option value="Boarder">Boarder</option>
                        </select>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">
                        {editingId ? "Save Changes" : "Add Student"}
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

export default StudentsPage;
