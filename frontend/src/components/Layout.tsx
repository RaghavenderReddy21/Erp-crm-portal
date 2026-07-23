import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { code: "01", label: "Dashboard", path: "/dashboard" },
  { code: "02", label: "Customers", path: "/customers" },
  { code: "03", label: "Products & Stock", path: "/products" },
  { code: "04", label: "Sales Challans", path: "/challans" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-mark">ECP</span>
          <h1>ERP + CRM Portal</h1>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="nav-code">{item.code}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="user-info">
          <span className="user-role-badge">{user?.role}</span>
          <div className="user-name">{user?.name}</div>
          <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}