import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";
import "./MembersPage.css";

const empty = { fullName: "", email: "", password: "", role: "committee", status: "active" };

const MembersPage = () => {
  const { token, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(empty);
  
  // UI State
  const [editingId, setEditingId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [toasts, setToasts] = useState([]);
  const [accessError, setAccessError] = useState(false);

  // Admin Check
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
    setAccessError(false);
    try {
      const res = await apiFetch("/api/members", { token, method: "GET" });
      setMembers(res.data || []);
    } catch (err) {
      if (err.message && (err.message.includes("403") || err.message.toLowerCase().includes("forbidden"))) {
         setAccessError(true);
      } else {
         addToast("Failed to load members", "error");
      }
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (m = null) => {
    if (m) {
      setEditingId(m._id);
      setForm({
        fullName: m.fullName,
        email: m.email,
        password: "",
        role: m.user?.role || "committee",
        status: m.status,
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
        addToast("Only Admins can manage members", "error");
        return;
    }

    try {
      if (editingId) {
        await apiFetch(`/api/members/${editingId}`, { token, method: "PUT", body: form });
        addToast("Member updated successfully");
      } else {
        await apiFetch("/api/members", { token, method: "POST", body: form });
        addToast("Member created successfully");
      }
      closeModal();
      load();
    } catch (err) {
      addToast(err.message || "Operation failed", "error");
    }
  };

  const remove = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await apiFetch(`/api/members/${id}`, { token, method: "DELETE" });
      addToast("Member deleted");
      load();
    } catch (err) {
      addToast("Failed to delete", "error");
    }
  };

  const filtered = useMemo(() => {
    return members.filter((m) =>
        `${m.fullName} ${m.email} ${m.user?.role || m.role}`.toLowerCase().includes(filter.toLowerCase())
    );
  }, [members, filter]);

  if (accessError) {
      return (
        <div className="members-page" style={{padding: 40, textAlign: "center"}}>
            <h2 style={{color: "#ef4444"}}>Access Denied</h2>
            <p>You must be an administrator to view this page.</p>
        </div>
      );
  }

  return (
    <div className="members-page">
      <div className="members-header">
        <h1>Committee Members</h1>
        <div className="members-toolbar">
           <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              placeholder="Search members..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={() => openModal()}>
                + New Member
            </button>
          )}
        </div>
      </div>

      <div className="members-table-container">
        {loading && <div style={{padding: 20, textAlign: "center", color: "#64748b"}}>Loading...</div>}
        {!loading && (
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                {isAdmin && <th style={{textAlign: "right"}}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div className="member-name">{m.fullName}</div>
                    <div className="member-email">{m.email}</div>
                  </td>
                  <td>
                     <span className={`role-badge ${m.user?.role || m.role}`}>
                        {m.user?.role || m.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-indicator ${m.status}`}>
                       <span style={{width: 8, height: 8, borderRadius: "50%", background: "currentColor", opacity: 0.7}}></span>
                       {m.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{textAlign: "right"}}>
                      <button className="action-btn edit" title="Edit" onClick={() => openModal(m)}>✎</button>
                      <button className="action-btn delete" title="Delete" onClick={() => remove(m._id)}>🗑</button>
                    </td>
                  )}
                </tr>
              ))}
               {filtered.length === 0 && !loading && (
                  <tr>
                      <td colSpan={isAdmin ? 4 : 3} style={{padding: 40, textAlign: "center", color: "#94a3b8"}}>
                          No members found.
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
              <h2>{editingId ? "Edit Member" : "Add New Member"}</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            <form onSubmit={submit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="John Doe"/>
                    </div>
                    
                    <div className="form-group">
                        <label>Email Address</label>
                        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com"/>
                    </div>
                    
                     <div className="form-group">
                        <label>Password {editingId ? "(Leave empty to keep current)" : ""}</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            required={!editingId}
                             placeholder={!editingId ? "Create a password" : "••••••••"}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Role</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="committee">Committee Member</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label>Status</label>
                        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn-primary">
                        {editingId ? "Save Changes" : "Create Account"}
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

export default MembersPage;
