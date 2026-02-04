// frontend/src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logout = () => {
    handleLogout();
    navigate("/");
  };

  const closeMenu = () => setIsMenuOpen(false);

  // ✅ Go home then scroll (HOME LINKS FIXED)
  const goToSection = (id) => {
    closeMenu();
    navigate("/");

    setTimeout(() => {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* LOGO (UNCHANGED) */}
        <div className="navbar-brand">
          <Link to="/" onClick={closeMenu}>
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="4" fill="white" />
                <path
                  d="M10 20C10 14.477 14.477 10 20 10"
                  stroke="#1e3a5f"
                  strokeWidth="4"
                />
                <path
                  d="M20 10C25.523 10 30 14.477 30 20"
                  stroke="#f97316"
                  strokeWidth="4"
                />
              </svg>
            </div>
            <span className="brand-text">BridgeMart</span>
          </Link>
        </div>

        {/* DESKTOP NAV (CENTER LINKS) */}
        <nav className="navbar-nav">
          {!user && (
            <>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Home
              </Link>

              <button
                type="button"
                className="nav-link nav-btn"
                onClick={() => goToSection("features")}
              >
                Features
              </button>

              <button
                type="button"
                className="nav-link nav-btn"
                onClick={() => goToSection("contact")}
              >
                Contact
              </button>
            </>
          )}

          {user && user.role === "admin" && (
            <>
              <Link to="/admin/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/admin/pending-users" className="nav-link">
                Pending
              </Link>
              <Link to="/admin/users" className="nav-link">
                Users
              </Link>
            </>
          )}

          {user && user.role === "supplier" && (
            <Link to="/supplier/dashboard" className="nav-link">
              Supplier Dashboard
            </Link>
          )}
        </nav>

        {/* RIGHT SIDE (FIXED POSITIONING) */}
        <div className="navbar-cta">
          {user && user.role === "supermarket" && (
            <Link
              to="/supermarket/dashboard"
              className="nav-link"
              style={{ marginRight: "12px" }}
            >
              Supermarket Dashboard
            </Link>
          )}

          {!user ? (
            <>
              <Link to="/login" className="btn-login">
                Login
              </Link>
              <Link to="/register" className="btn-get-started">
                Get Started
              </Link>
            </>
          ) : (
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
