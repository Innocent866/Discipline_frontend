import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const empty = { fullName: "", email: "", password: "", role: "committee", status: "active" };

const MembersPage = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    try {
      setError("");
      const res = await apiFetch("/api/members", { token, method: "GET" });
      setMembers(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load members");
      setMembers([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/members/${editingId}`, { token, method: "PUT", body: form });
    } else {
      await apiFetch("/api/members", { token, method: "POST", body: form });
    }
    setForm(empty);
    setEditingId("");
    load();
  };

  const startEdit = (m) => {
    setEditingId(m._id);
    setForm({
      fullName: m.fullName,
      email: m.email,
      password: "",
      role: m.user?.role || "committee",
      status: m.status,
    });
  };

  const remove = async (id) => {
    await apiFetch(`/api/members/${id}`, { token, method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="toolbar">
        <h1>Committee Members</h1>
      </div>

      {error && (
        <div className="card" style={{ color: "#b91c1c" }}>
          {error.includes("403") || error.toLowerCase().includes("forbidden")
            ? "Admins only: log in with an admin account to view/manage members."
            : error}
        </div>
      )}

      <div className="card">
        <h3>{editingId ? "Edit Member" : "Add Member"}</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Full Name</label>
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label>Password {editingId ? "(leave blank to keep)" : ""}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingId}
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="committee">Committee</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <button type="submit">{editingId ? "Update" : "Create"}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={() => { setEditingId(""); setForm(empty); }}>
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "flex-end" }}>
          <input
            placeholder="Filter by name, email, role..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members
              .filter((m) =>
                `${m.fullName} ${m.email} ${m.user?.role || m.role}`.toLowerCase().includes(filter.toLowerCase())
              )
              .map((m) => (
              <tr key={m._id}>
                <td>{m.fullName}</td>
                <td>{m.email}</td>
                <td>
                  <span className={`pill ${m.user?.role || m.role}`}>
                    {m.user?.role || m.role}
                  </span>
                </td>
                <td><span className="pill">{m.status}</span></td>
                <td>
                  <button className="secondary" onClick={() => startEdit(m)}>Edit</button>{" "}
                  <button style={{ background: "#ef4444" }} onClick={() => remove(m._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default MembersPage;

