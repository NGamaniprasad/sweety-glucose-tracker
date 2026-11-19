
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="nav-brand">
          <span className="brand-icon">S</span>
          <span>Sweety</span>
        </NavLink>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Reports
          </NavLink>
        </nav>

        <div className="nav-actions">
          <span className="nav-user">
            {user?.name || "User"}
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline btn-small"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
