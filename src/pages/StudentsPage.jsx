import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const emptyForm = { firstName: "", lastName: "", studentId: "", className: "", status: "active" };

const StudentsPage = () => {
  const { token, user } = useAuth();
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const isAdmin = user?.role === "admin";

  const load = async () => {
    const data = await apiFetch("/api/students", { token });
    setStudents(data.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (editingId) {
      await apiFetch(`/api/students/${editingId}`, { token, method: "PUT", body: form });
    } else {
      await apiFetch("/api/students", { token, method: "POST", body: form });
    }
    setForm(emptyForm);
    setEditingId("");
    load();
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      studentId: s.studentId,
      className: s.className,
      status: s.status,
    });
  };

  const deleteStudent = async (id) => {
    if (!isAdmin) return;
    await apiFetch(`/api/students/${id}`, { token, method: "DELETE" });
    load();
  };

  const filtered = students.filter((s) => {
    const text = `${s.firstName} ${s.lastName} ${s.studentId} ${s.className}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  return (
    <>
      <div className="toolbar">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h1>Students</h1>
          <div className={`pill ${isAdmin ? "admin" : "committee"}`}>
            {isAdmin ? "Admin can add/remove" : "Read only for committee"}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h3>{editingId ? "Edit Student" : "Add Student"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <div className="field">
              <label>Student ID</label>
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
            </div>
            <div className="field">
              <label>Class</label>
              <input value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} required />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button type="submit">{editingId ? "Update" : "Create"}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={() => { setEditingId(""); setForm(emptyForm); }}>
                Cancel
              </button>
            )}
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "flex-end" }}>
          <input
            placeholder="Search students..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>ID</th>
              <th>Class</th>
              <th>Status</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s._id}>
                <td>{s.firstName} {s.lastName}</td>
                <td>{s.studentId}</td>
                <td>{s.className}</td>
                <td><span className="pill">{s.status}</span></td>
                {isAdmin && (
                  <td>
                    <button className="secondary" onClick={() => startEdit(s)}>Edit</button>{" "}
                    <button style={{ background: "#ef4444" }} onClick={() => deleteStudent(s._id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentsPage;

