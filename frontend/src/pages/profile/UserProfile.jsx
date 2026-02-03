import React from "react";
import { useAuth } from "../../context/AuthContext";
import "./UserProfile.css";

const UserProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return <p className="profile-loading">Loading profile...</p>;
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      {/* PROFILE CARD */}
      <div className="profile-card">
        {/* HEADER */}
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>

          <div className="profile-header-info">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email">{user.email}</p>

            <div className="profile-badges">
              <span
                className={`badge ${
                  user.isActive ? "badge-active" : "badge-inactive"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>

              <span
                className={`badge ${
                  user.isApproved ? "badge-approved" : "badge-pending"
                }`}
              >
                {user.isApproved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>
        </div>

        {/* QUICK STATS */}
        <div className="profile-stats">
          <div className="stat-box">
            <span className="stat-label">Role</span>
            <span className="stat-value">{user.role}</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">District</span>
            <span className="stat-value">{user.district || "N/A"}</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>

        {/* ACCOUNT DETAILS */}
        <div className="profile-section">
          <h3 className="section-title">Account Details</h3>

          <ProfileRow label="Full Name" value={user.name} />
          <ProfileRow label="Email Address" value={user.email} />
          <ProfileRow label="User Role" value={user.role} />
          <ProfileRow label="District" value={user.district || "N/A"} />
        </div>

        {/* SECURITY */}
        <div className="profile-section">
          <h3 className="section-title">Security</h3>

          <ProfileRow label="Password" value="••••••••" />
          <ProfileRow label="Last Login" value="Recently" />
        </div>
      </div>
    </div>
  );
};

const ProfileRow = ({ label, value }) => (
  <div className="profile-row">
    <span className="profile-label">{label}</span>
    <span className="profile-value">{value}</span>
  </div>
);

export default UserProfile;
