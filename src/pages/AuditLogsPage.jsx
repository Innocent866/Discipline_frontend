import React, { useEffect, useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";
import { apiFetch } from "../lib/api.js";

const AuditLogsPage = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await apiFetch("/api/audit-logs", { token });
      setLogs(res.data);
    };
    load();
  }, []);

  const filtered = logs.filter((l) =>
    `${l.action} ${l.user?.fullName || ""} ${l.targetType} ${l.targetId || ""}`
      .toLowerCase()
      .includes(filter.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <h1>Audit Logs</h1>
        <div className="pill admin">Admin Only</div>
      </div>
      <div className="card" style={{ overflowX: "auto" }}>
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "flex-end" }}>
          <input
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Target</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l._id}>
                <td>{l.action}</td>
                <td>{l.user?.fullName}</td>
                <td>{l.targetType}</td>
                <td>{new Date(l.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default AuditLogsPage;

