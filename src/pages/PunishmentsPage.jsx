import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./PunishmentsPage.css";

const empty = { name: "", description: "", pointsRequired: 0, durationDays: 0 };

const PunishmentsPage = () => {
  const { token, user } = useAuth();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  
  // UI State
  const [editingId, setEditingId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [toasts, setToasts] = useState([]);

  // Admin check (Punishments are generally admin managed)
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
      const res = await apiFetch("/api/punishments", { token });
      setList(res.data);
    } catch (err) {
      addToast("Failed to load punishments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (p = null) => {
    if (p) {
      setEditingId(p._id);
      setForm({
        name: p.name,
        description: p.description || "",
        pointsRequired: p.pointsRequired,
        durationDays: p.durationDays || 0,
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
    if (!isAdmin) {
        addToast("Only Admins can manage punishments", "error");
        return;
    }
    
    const payload = {
      ...form,
      pointsRequired: Number(form.pointsRequired),
      durationDays: Number(form.durationDays),
    };
    
    try {
        if (editingId) {
            await apiFetch(`/api/punishments/${editingId}`, { token, method: "PUT", body: payload });
            addToast("Template updated");
        } else {
            await apiFetch("/api/punishments", { token, method: "POST", body: payload });
            addToast("Template created");
        }
        closeModal();
        load();
    } catch (err) {
        addToast("Operation failed", "error");
    }
  };

  const remove = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
        await apiFetch(`/api/punishments/${id}`, { token, method: "DELETE" });
        addToast("Template deleted");
        load();
    } catch (err) {
        addToast("Failed to delete", "error");
    }
  };

  const filtered = useMemo(() => {
    return list.filter((p) =>
        `${p.name} ${p.pointsRequired} ${p.durationDays || ""}`.toLowerCase().includes(filter.toLowerCase())
    );
  }, [list, filter]);

  return (
    <div className="punishments-page">
      <div className="punishments-header">
        <h1>Punishment Templates</h1>
        <div className="punishments-toolbar">
           <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search templates..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => openModal()}>
                + New Template
            </button>
          )}
        </div>
      </div>

      <div className="punishments-table-container">
        {loading && <div style={{padding: 20, textAlign: "center", color: "#64748b"}}>Loading...</div>}
        {!loading && (
          <table className="punishments-table">
            <thead>
              <tr>
                <th>Punishment Name</th>
                <th>Points Required</th>
                <th>Duration</th>
                {isAdmin && <th style={{textAlign: "right"}}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="template-name">{p.name}</div>
                    {p.description && <div className="template-description">{p.description}</div>}
                  </td>
                  <td>
                    <span className="points-pill">{p.pointsRequired} pts</span>
                  </td>
                  <td>
                    {p.durationDays > 0 ? (
                        <span className="duration-pill">{p.durationDays} days</span>
                    ) : <span style={{color: "#94a3b8"}}>N/A</span>}
                  </td>
                  {isAdmin && (
                    <td style={{textAlign: "right"}}>
                        <button className="action-btn edit" title="Edit" onClick={() => openModal(p)}>✎</button>
                        <button className="action-btn delete" title="Delete" onClick={() => remove(p._id)}>🗑</button>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                  <tr>
                      <td colSpan={ isAdmin ? 4 : 3} style={{padding: 40, textAlign: "center", color: "#94a3b8"}}>
                          No templates found.
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
              <h2>{editingId ? "Edit Template" : "New Punishment Template"}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={submit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Name</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Detention"/>
                    </div>
                    
                    <div className="form-group">
                        <label>Description (Optional)</label>
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details about this punishment..."/>
                    </div>
                    
                    <div className="form-group">
                        <label>Points Threshold</label>
                         <input
                            type="number"
                            min="0"
                            required
                            value={form.pointsRequired}
                            onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
                            placeholder="Minimum points to trigger this"
                        />
                         <div style={{fontSize: 12, color: "#94a3b8"}}>Student is recommended this punishment if they reach this score.</div>
                    </div>
                    
                    <div className="form-group">
                        <label>Duration (Days)</label>
                        <input
                             type="number"
                            min="0"
                            value={form.durationDays}
                            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                            placeholder="0 if not applicable"
                        />
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">
                        {editingId ? "Save Changes" : "Create Template"}
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

export default PunishmentsPage;
