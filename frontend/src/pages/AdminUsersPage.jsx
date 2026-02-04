import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import "./AdminUsersPage.css"; // Ensure you import the CSS file

const AdminUsersPage = () => {
  const [roleFilter, setRoleFilter] = useState("supplier");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔄 Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // 🚫 Deactivate user
  const handleDeactivate = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user's access?")) return;
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      alert("User access removed successfully");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to deactivate user");
    }
  };

  // ♻️ Activate user
  const handleActivate = async (userId) => {
    if (!window.confirm("Are you sure you want to re-activate this user?")) return;
    try {
      await api.put(`/admin/users/${userId}/activate`);
      alert("User re-activated successfully");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to activate user");
    }
  };

  // ❌❌ PERMANENT DELETE
  const handlePermanentDelete = async (userId) => {
    const confirmDelete = window.confirm(
      "⚠️ WARNING!\n\nThis will PERMANENTLY delete the user.\nThis action CANNOT be undone.\n\nDo you want to continue?"
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/users/${userId}/permanent`);
      alert("User permanently deleted");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to permanently delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [roleFilter, statusFilter]);

  // --- Icons (Inline SVGs for no dependencies) ---
  const IconRefresh = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/></svg>
  );
  const IconTrash = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  );
  const IconBan = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
  );
  const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
  );

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <h2 className="admin-title">User Management</h2>
        <p className="admin-subtitle">
          Monitor access, approve accounts, and manage system permissions.
        </p>
      </div>

      {/* Filters & Controls */}
      <div className="filter-card">
        <div className="filter-group">
          <label className="filter-label">Filter by Role</label>
          <select 
            className="modern-select"
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="supplier">Supplier</option>
            <option value="supermarket">Supermarket</option>
            <option value="all">All Roles</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Filter by Status</label>
          <select
            className="modern-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        <button className="btn-refresh" onClick={fetchUsers}>
          <IconRefresh /> Refresh List
        </button>
      </div>

      {/* Content Area */}
      {loading && <div className="loading-state">Loading user data...</div>}
      
      {error && <div className="error-state">Error: {error}</div>}

      {!loading && !error && users.length === 0 && (
        <div className="empty-state">No users found matching these filters.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role</th>
                <th>Approval</th>
                <th>Access Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{u.name}</span>
                      <span className="user-email">{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="role-badge">{u.role}</span>
                  </td>
                  <td>
                    {u.isApproved ? (
                      <span style={{color: '#15803d', fontWeight:'600'}}>✓ Approved</span>
                    ) : (
                      <span style={{color: '#ca8a04', fontWeight:'600'}}>⏳ Pending</span>
                    )}
                  </td>
                  <td>
                    {u.isActive ? (
                      <span className="status-badge status-active">Active</span>
                    ) : (
                      <span className="status-badge status-inactive">Inactive</span>
                    )}
                  </td>
                  <td style={{color: '#64748b', fontSize: '0.85rem'}}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    {/* Actions Column */}
                    {u.role !== "admin" && (
                      <div className="actions-cell">
                        {u.isActive ? (
                          <button
                            className="btn-icon btn-soft-remove"
                            onClick={() => handleDeactivate(u._id)}
                            title="Deactivate User"
                          >
                            <IconBan /> Remove
                          </button>
                        ) : (
                          <button
                            className="btn-icon btn-reactivate"
                            onClick={() => handleActivate(u._id)}
                            title="Reactivate User"
                          >
                            <IconCheck /> Rectivate
                          </button>
                        )}

                        {/* Permanent delete is purely icon-based to save space but red to warn */}
                        <button
                          className="btn-icon btn-permanent-delete"
                          onClick={() => handlePermanentDelete(u._id)}
                          title="Permanently Delete"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;