import React, { useState } from "react";
import { useAuth } from "../state/AuthProvider.jsx";

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ fullName, ...(password ? { password } : {}) });
      setPassword("");
      setStatus("Updated successfully");
    } catch (error) {
      setStatus(error.message || "Failed to update");
    }
  };

  return (
    <>
      <div className="toolbar">
        <h1>My Profile</h1>
      </div>
      <div className="card" style={{ maxWidth: 520 }}>
        <form onSubmit={submit}>
          <div className="field">
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label>New Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
          <button type="submit">Save</button>
          {status && <p style={{ marginTop: 8 }}>{status}</p>}
        </form>
      </div>
    </>
  );
};

export default ProfilePage;

