import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import type { UserRole } from "../types";

interface LayoutProps {
  children: ReactNode;
}

interface StoredUser {
  name?: string;
  role?: UserRole;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  ) as StoredUser;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">N</div>

          <div>
            <h2>NEXORA OPS</h2>
            <span>ERP + CRM</span>
          </div>
        </div>

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-number">01</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/customers"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-number">02</span>
            <span>Customers</span>
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-number">03</span>
            <span>Products</span>
          </NavLink>

          <NavLink
            to="/stock-movements"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-number">04</span>
            <span>Stock Movements</span>
          </NavLink>

          <NavLink
            to="/challans"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-number">05</span>
            <span>Sales Challans</span>
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>

            <div className="sidebar-user-details">
              <strong>
                {user.name || "System Admin"}
              </strong>

              <span>
                {user.role || "ADMIN"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
          >
            <span>↪</span>
            Sign out
          </button>

          <div className="sidebar-version">
            NEXORA OPS <span>v1.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;