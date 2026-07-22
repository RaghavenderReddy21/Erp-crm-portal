import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

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
        <h1>ERP + CRM Portal</h1>
        <nav>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? "active" : "")}>
            Customers
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? "active" : "")}>
            Products & Stock
          </NavLink>
          <NavLink to="/challans" className={({ isActive }) => (isActive ? "active" : "")}>
            Sales Challans
          </NavLink>
        </nav>
        <div className="user-info">
          <div>{user?.name}</div>
          <div>{user?.role}</div>
          <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
