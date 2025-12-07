// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Inventory System</Link>
      </div>

      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/login" className="navbar-link">
              Login
            </Link>
            <Link to="/register" className="navbar-link">
              Register
            </Link>
          </>
        )}

        {user && (
          <>
            {user.role === "admin" && (
              <>
                <Link to="/admin/dashboard" className="navbar-link">
                  Admin Dashboard
                </Link>
                <Link to="/admin/pending-users" className="navbar-link">
                  Pending Users
                </Link>
                <Link to="/admin/users" className="navbar-link">
                  Manage Users
                </Link>
              </>
            )}

            {user.role === "supplier" && (
              <Link to="/supplier/dashboard" className="navbar-link">
                Supplier Dashboard
              </Link>
            )}

            {user.role === "supermarket" && (
              <Link to="/supermarket/dashboard" className="navbar-link">
                Supermarket Dashboard
              </Link>
            )}

            <button className="navbar-logout-btn" onClick={logout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
