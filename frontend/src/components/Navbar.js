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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-brand">
          <Link to="/">
            <div className="logo-icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="40" height="40" rx="4" fill="white"/>
                <path d="M10 20C10 14.477 14.477 10 20 10" stroke="#1e3a5f" strokeWidth="4" strokeLinecap="round"/>
                <path d="M20 10C25.523 10 30 14.477 30 20" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="brand-text">BridgeMart</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          {!user && (
            <>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Home
              </Link>
              <Link
                to="/"
                className="nav-link"
                onClick={() => {
                  closeMenu();
                  setTimeout(() => {
                    const section = document.getElementById("features");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
              >
                Features
              </Link>
              <Link
                to="/"
                className="nav-link"
                onClick={() => {
                  closeMenu();
                  setTimeout(() => {
                    const section = document.getElementById("contact");
                    if (section) {
                      section.scrollIntoView({ behavior: "smooth" });
                    }
                  }, 100);
                }}
              >
                Contact
              </Link>
            </>
          )}

          {/* ROLE-BASED LINKS (only when logged in) */}
          {user && (
            <>
              {user.role === "admin" && (
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

              {user.role === "supplier" && (
                <Link to="/supplier/dashboard" className="nav-link">
                  Supplier Dashboard
                </Link>
              )}

              {user.role === "supermarket" && (
                <Link to="/supermarket/dashboard" className="nav-link">
                  Supermarket Dashboard
                </Link>
              )}
            </>
          )}
        </nav>

        {/* CTA Buttons */}
        <div className="navbar-cta">
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
              <svg viewBox="0 0 512 512" className="logout-icon">
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
              </svg>
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMenu}>
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            {!user && (
              <>
                <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                  Home
                </Link>
                <Link
                  to="/"
                  className="mobile-nav-link"
                  onClick={() => {
                    closeMenu();
                    setTimeout(() => {
                      const section = document.getElementById("features");
                      if (section) {
                        section.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100);
                  }}
                >
                  Features
                </Link>
                <Link
                  to="/"
                  className="mobile-nav-link"
                  onClick={() => {
                    closeMenu();
                    setTimeout(() => {
                      const section = document.getElementById("contact");
                      if (section) {
                        section.scrollIntoView({ behavior: "smooth" });
                      }
                    }, 100);
                  }}
                >
                  Contact
                </Link>
              </>
            )}

            {user && (
              <>
                {user.role === "admin" && (
                  <>
                    <Link to="/admin/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                      Dashboard
                    </Link>
                    <Link to="/admin/pending-users" className="mobile-nav-link" onClick={closeMenu}>
                      Pending
                    </Link>
                    <Link to="/admin/users" className="mobile-nav-link" onClick={closeMenu}>
                      Users
                    </Link>
                  </>
                )}

                {user.role === "supplier" && (
                  <Link to="/supplier/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                    Supplier Dashboard
                  </Link>
                )}

                {user.role === "supermarket" && (
                  <Link to="/supermarket/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                    Supermarket Dashboard
                  </Link>
                )}
              </>
            )}

            <div className="mobile-cta">
              {!user ? (
                <>
                  <Link to="/login" className="btn-login-mobile" onClick={closeMenu}>
                    Login
                  </Link>
                  <Link to="/register" className="btn-get-started-mobile" onClick={closeMenu}>
                    Get Started
                  </Link>
                </>
              ) : (
                <button className="btn-logout-mobile" onClick={() => { closeMenu(); logout(); }}>
                  Logout
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
