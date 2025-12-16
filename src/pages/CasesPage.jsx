import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

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
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [offenses, setOffenses] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [casesRes, studentsRes, offenseRes, punishRes] = await Promise.all([
        apiFetch("/api/cases", { token }),
        apiFetch("/api/students", { token }),
        apiFetch("/api/offense-types", { token }),
        apiFetch("/api/punishments", { token }),
      ]);
      setCases(casesRes.data);
      setStudents(studentsRes.data);
      setOffenses(offenseRes.data);
      setPunishments(punishRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/cases/${editingId}`, { token, method: "PUT", body: form });
    } else {
      await apiFetch("/api/cases", { token, method: "POST", body: form });
    }
    setEditingId("");
    setForm(empty);
    load();
  };

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      student: c.student?._id,
      offenseType: c.offenseType?._id,
      description: c.description,
      eventDate: c.eventDate ? c.eventDate.slice(0, 10) : "",
      location: c.location || "",
      suggestedPunishment: c.suggestedPunishment?._id || "",
    });
  };

  const resolve = async (id) => {
    await apiFetch(`/api/cases/${id}/resolve`, { token, method: "POST", body: { resolutionNotes: "Resolved" } });
    load();
  };

  const approve = async (id) => {
    await apiFetch(`/api/cases/${id}/approve`, { token, method: "POST" });
    load();
  };

  const canEdit = (c) =>
    user.role === "admin" || (c.reporter?._id === user.id && c.status === "pending");

  const canResolve = (c) =>
    user.role === "admin" || c.reporter?._id === user.id;

  const formattedCases = useMemo(
    () =>
      cases.map((c) => ({
        ...c,
        studentName: `${c.student?.firstName || ""} ${c.student?.lastName || ""}`.trim(),
      })),
    [cases]
  );

  const filteredCases = formattedCases.filter((c) => {
    const text = `${c.studentName} ${c.offenseType?.name || ""} ${c.status} ${c.reporter?.fullName || ""}`.toLowerCase();
    return text.includes(filter.toLowerCase());
  });

  return (
    <>
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1>Disciplinary Cases</h1>
          {loading && <span>Loading...</span>}
        </div>
      </div>

      <div className="card">
        <h3>{editingId ? "Edit Case" : "Report Case"}</h3>
        <form onSubmit={submit}>
          <div className="field">
            <label>Student</label>
            <select
              required
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option value={s._id} key={s._id}>
                  {s.firstName} {s.lastName} ({s.studentId})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Offense Type</label>
            <select
              required
              value={form.offenseType}
              onChange={(e) => setForm({ ...form, offenseType: e.target.value })}
            >
              <option value="">Select offense</option>
              {offenses.map((o) => (
                <option value={o._id} key={o._id}>
                  {o.name} (pts: {o.pointValue})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Event Date</label>
            <input
              type="date"
              required
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Suggested Punishment</label>
            <select
              value={form.suggestedPunishment}
              onChange={(e) => setForm({ ...form, suggestedPunishment: e.target.value })}
            >
              <option value="">Optional</option>
              {punishments.map((p) => (
                <option value={p._id} key={p._id}>
                  {p.name} (pts: {p.pointsRequired})
                </option>
              ))}
            </select>
          </div>
          <button type="submit">{editingId ? "Update" : "Submit"}</button>
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
            placeholder="Filter by student, offense, status, reporter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Offense</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => (
              <tr key={c._id}>
                <td>{c.studentName}</td>
                <td>{c.offenseType?.name}</td>
                <td><span className={`pill ${c.status}`}>{c.status}</span></td>
                <td>{c.reporter?.fullName}</td>
                <td>
                  {canEdit(c) && (
                    <button className="secondary" onClick={() => startEdit(c)}>Edit</button>
                  )}{" "}
                  {user.role === "admin" && c.status === "pending" && (
                    <button onClick={() => approve(c._id)}>Approve</button>
                  )}{" "}
                  {canResolve(c) && c.status !== "resolved" && (
                    <button onClick={() => resolve(c._id)}>Mark Resolved</button>
                  )}
                  {user.role === "admin" && (
                    <button
                      style={{ background: "#ef4444", marginLeft: 6 }}
                      onClick={() => apiFetch(`/api/cases/${c._id}`, { token, method: "DELETE" }).then(load)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default CasesPage;

