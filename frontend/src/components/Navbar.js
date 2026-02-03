// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="navbar-brand">
        <Link to="/">📦 BridgeMart</Link>
      </div>

      <div className="navbar-links">
        {/* PUBLIC LINKS (only when NOT logged in) */}
        {!user && (
          <>
            <Link to="/" className="nav-link public-link">
              Home
            </Link>
            <Link
  to="/"
  className="nav-link public-link"
  onClick={() => {
    setTimeout(() => {
      const section = document.getElementById("about");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }}
>
  About
</Link>
<Link
  to="/"
  className="nav-link public-link"
  onClick={() => {
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

            {/* ඔයාගේ පරණ Logout button එක වෙනුවට මේක Replace කරන්න */}

<button className="Btn" onClick={logout}> {/* <-- ඔයාගේ logout function එක මෙතන දාන්න */}
  <div className="sign">
    <svg viewBox="0 0 512 512">
      <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
    </svg>
  </div>
  <div className="text">Logout</div>
</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
