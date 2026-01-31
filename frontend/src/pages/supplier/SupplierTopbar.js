import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './SupplierTopbar.css';

/* Icons */

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const SupplierTopbar = () => {
  const navigate = useNavigate();
  const { user, handleLogout: authLogout } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userName = user?.name || 'Supplier';
  const userRole = user?.role || 'Supplier';
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authLogout();
    navigate('/login');
  };

  return (
    <div className="supplier-topbar">

      {/* Right Section Only */}
      <div className="topbar-right">
        <div className="user-profile-container" ref={dropdownRef}>
          <button
            className="user-profile-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar">{userInitials}</div>

            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">{userRole}</span>
            </div>

            <ChevronDownIcon />
          </button>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{userInitials}</div>
                <div className="dropdown-user-info">
                  <span className="dropdown-user-name">{userName}</span>
                  <span className="dropdown-user-email">
                    {userEmail || 'supplier@email.com'}
                  </span>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-item"
                onClick={() => navigate('/supplier/profile')}
              >
                <UserIcon />
                <span>My Profile</span>
              </button>

              <div className="dropdown-divider"></div>

              <button className="dropdown-item logout" onClick={handleLogout}>
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierTopbar;
