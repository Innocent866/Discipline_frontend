import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const empty = { name: "", description: "", pointValue: 0, suggestedPunishments: "" };

const OffenseTypesPage = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    const res = await apiFetch("/api/offense-types", { token });
    setList(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      pointValue: Number(form.pointValue),
      suggestedPunishments: form.suggestedPunishments
        ? form.suggestedPunishments.split(",").map((s) => s.trim())
        : [],
    };
    if (editingId) {
      await apiFetch(`/api/offense-types/${editingId}`, { token, method: "PUT", body: payload });
    } else {
      await apiFetch("/api/offense-types", { token, method: "POST", body: payload });
    }
    setForm(empty);
    setEditingId("");
    load();
  };

  const startEdit = (o) => {
    setEditingId(o._id);
    setForm({
      name: o.name,
      description: o.description || "",
      pointValue: o.pointValue,
      suggestedPunishments: (o.suggestedPunishments || []).join(", "),
    });
  };

  const remove = async (id) => {
    await apiFetch(`/api/offense-types/${id}`, { token, method: "DELETE" });
    load();
  };

  return (
    <>
      <div className="toolbar">
        <h1>Offense Types</h1>
      </div>

      <div className="card">
        <h3>{editingId ? "Edit" : "Create"} Offense Type</h3>
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
            <label>Point Value</label>
            <input
              type="number"
              min="0"
              required
              value={form.pointValue}
              onChange={(e) => setForm({ ...form, pointValue: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Suggested Punishments (comma separated)</label>
            <input
              value={form.suggestedPunishments}
              onChange={(e) => setForm({ ...form, suggestedPunishments: e.target.value })}
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
            placeholder="Filter offenses..."
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
              <th>Suggested</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list
              .filter((o) =>
                `${o.name} ${o.pointValue} ${(o.suggestedPunishments || []).join(" ")}`.toLowerCase()
                  .includes(filter.toLowerCase())
              )
              .map((o) => (
              <tr key={o._id}>
                <td>{o.name}</td>
                <td>{o.pointValue}</td>
                <td>{(o.suggestedPunishments || []).join(", ")}</td>
                <td>
                  <button className="secondary" onClick={() => startEdit(o)}>Edit</button>{" "}
                  <button style={{ background: "#ef4444" }} onClick={() => remove(o._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default OffenseTypesPage;

