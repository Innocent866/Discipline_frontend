import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="card login-card">
        <h2>Disciplinary Committee</h2>
        <p>Please sign in to continue</p>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                style={{ flex: 1 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                required
              />
              <button
                type="button"
                className="secondary"
                onClick={() => setShowPassword((v) => !v)}
                style={{ minWidth: 90 }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && (
            <div className="field" style={{ color: "#b91c1c" }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

