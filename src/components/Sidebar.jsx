import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../state/AuthProvider.jsx";

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/students", label: "Students" },
    { to: "/cases", label: "Cases" },
    { to: "/offense-types", label: "Offense Types", roles: ["admin"] },
    { to: "/punishments", label: "Punishments", roles: ["admin"] },
    { to: "/members", label: "Members", roles: ["admin"] },
    { to: "/audit-logs", label: "Audit Logs", roles: ["admin"] },
    { to: "/profile", label: "My Profile" },
  ];

  return (
    <aside className="sidebar">
      <h2>Discipline</h2>
      <div style={{ marginBottom: 12, fontSize: 13, color: "#94a3b8" }}>
        Signed in as <br />
        <strong style={{ color: "#e2e8f0" }}>{user.fullName}</strong>
        <div className={`pill ${user.role}`}>{user.role}</div>
      </div>
      <nav>
        {links
          .filter((l) => !l.roles || l.roles.includes(user.role))
          .map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
      </nav>
      <button
        style={{ marginTop: 16, width: "100%", background: "#ef4444" }}
        onClick={logout}
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;

