import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./OffenseTypesPage.css";

const empty = { name: "", description: "", pointValue: 0, suggestedPunishments: "" };

const OffenseTypesPage = () => {
  const { token } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  
  // UI State
  const [editingId, setEditingId] = useState("");
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
      const res = await apiFetch("/api/offense-types", { token });
      setList(res.data);
    } catch (err) {
      addToast("Failed to load offenses", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (offense = null) => {
    if (offense) {
      setEditingId(offense._id);
      setForm({
        name: offense.name,
        description: offense.description || "",
        pointValue: offense.pointValue,
        suggestedPunishments: (offense.suggestedPunishments || []).join(", "),
      });
    } else {
      setEditingId("");
      setForm(empty);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId("");
    setForm(empty);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      pointValue: Number(form.pointValue),
      suggestedPunishments: form.suggestedPunishments
        ? form.suggestedPunishments.split(",").map((s) => s.trim()).filter(s => s)
        : [],
    };
    
    try {
        if (editingId) {
            await apiFetch(`/api/offense-types/${editingId}`, { token, method: "PUT", body: payload });
            addToast("Offense type updated");
        } else {
            await apiFetch("/api/offense-types", { token, method: "POST", body: payload });
            addToast("Offense type created");
        }
        closeModal();
        load();
    } catch (err) {
        addToast("Operation failed", "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Are you sure you want to delete this offense type?")) return;
    try {
        await apiFetch(`/api/offense-types/${id}`, { token, method: "DELETE" });
        addToast("Offense type deleted");
        load();
    } catch (err) {
        addToast("Failed to delete", "error");
    }
  };

  const filtered = useMemo(() => {
    return list.filter((o) =>
        `${o.name} ${o.pointValue} ${(o.suggestedPunishments || []).join(" ")}`.toLowerCase()
            .includes(filter.toLowerCase())
    );
  }, [list, filter]);

  return (
    <div className="offenses-page">
      <div className="offenses-header">
        <h1>Offense Types</h1>
        <div className="offenses-toolbar">
           <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search offenses..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => openModal()}>
            + New Offense
          </button>
        </div>
      </div>

      <div className="offenses-table-container">
        {loading && <div style={{padding: 20, textAlign: "center", color: "#64748b"}}>Loading...</div>}
        {!loading && (
          <table className="offenses-table">
            <thead>
              <tr>
                <th>Offense Name</th>
                <th>Points</th>
                <th>Suggested Punishments</th>
                <th style={{textAlign: "right"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o._id}>
                  <td>
                    <div className="offense-name">{o.name}</div>
                    {o.description && <div className="offense-description">{o.description}</div>}
                  </td>
                  <td>
                    <div className="points-badge">{o.pointValue}</div>
                  </td>
                  <td>
                    <div className="punishment-tags">
                        {o.suggestedPunishments && o.suggestedPunishments.length > 0 ? (
                            o.suggestedPunishments.map((p, i) => (
                                <span key={i} className="punishment-tag">{p}</span>
                            ))
                        ) : <span style={{color: "#cbd5e1", fontStyle: "italic", fontSize: 12}}>None</span>}
                    </div>
                  </td>
                  <td style={{textAlign: "right"}}>
                    <button className="action-btn edit" title="Edit" onClick={() => openModal(o)}>✎</button>
                    <button className="action-btn delete" title="Delete" onClick={() => remove(o._id)}>🗑</button>
                  </td>
                </tr>
              ))}
               {filtered.length === 0 && !loading && (
                  <tr>
                      <td colSpan={4} style={{padding: 40, textAlign: "center", color: "#94a3b8"}}>
                          No offense types found.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
             <div className="modal-header">
              <h2>{editingId ? "Edit Offense Type" : "Create Offense Type"}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={submit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Name</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Late Arrival"/>
                    </div>
                    
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the offense"/>
                    </div>
                    
                    <div className="form-group">
                        <label>Point Value</label>
                         <input
                            type="number"
                            min="0"
                            required
                            value={form.pointValue}
                            onChange={(e) => setForm({ ...form, pointValue: e.target.value })}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Suggested Punishments</label>
                        <input
                            value={form.suggestedPunishments}
                            onChange={(e) => setForm({ ...form, suggestedPunishments: e.target.value })}
                            placeholder="e.g. Warning, Detention"
                        />
                        <div className="helper-text">Separate multiple suggestions with commas</div>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">
                        {editingId ? "Save Changes" : "Create Offense"}
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

export default OffenseTypesPage;
