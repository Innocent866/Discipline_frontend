import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const empty = { name: "", description: "", pointsRequired: 0, durationDays: 0 };

const PunishmentsPage = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    const res = await apiFetch("/api/punishments", { token });
    setList(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      pointsRequired: Number(form.pointsRequired),
      durationDays: Number(form.durationDays),
    };
    if (editingId) {
      await apiFetch(`/api/punishments/${editingId}`, { token, method: "PUT", body: payload });
    } else {
      await apiFetch("/api/punishments", { token, method: "POST", body: payload });
    }
    setForm(empty);
    setEditingId("");
    load();
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description || "",
      pointsRequired: p.pointsRequired,
      durationDays: p.durationDays || 0,
    });
  };

  const remove = async (id) => {
    await apiFetch(`/api/punishments/${id}`, { token, method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="toolbar">
        <h1>Punishment Templates</h1>
      </div>

      <div className="card">
        <h3>{editingId ? "Edit" : "Create"} Template</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Points Required</label>
            <input
              type="number"
              min="0"
              required
              value={form.pointsRequired}
              onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Duration (days)</label>
            <input
              type="number"
              min="0"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            />
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
            placeholder="Filter punishments..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Points</th>
              <th>Duration</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list
              .filter((p) =>
                `${p.name} ${p.pointsRequired} ${p.durationDays || ""}`.toLowerCase().includes(filter.toLowerCase())
              )
              .map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.pointsRequired}</td>
                <td>{p.durationDays || "-"}</td>
                <td>
                  <button className="secondary" onClick={() => startEdit(p)}>Edit</button>{" "}
                  <button style={{ background: "#ef4444" }} onClick={() => remove(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PunishmentsPage;

