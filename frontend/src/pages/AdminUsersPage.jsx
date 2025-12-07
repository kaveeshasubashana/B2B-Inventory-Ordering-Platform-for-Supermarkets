// frontend/src/pages/AdminUsersPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";

const AdminUsersPage = () => {
  const [roleFilter, setRoleFilter] = useState("supplier");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const res = await api.get("/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [roleFilter, statusFilter]);

  return (
    <div className="admin-page">
      <h2 className="admin-header-title">Manage Suppliers &amp; Supermarkets</h2>
      <p className="admin-header-subtitle">
        Filter and view registered suppliers, supermarkets, and admins.
      </p>

      <div className="admin-filter-row">
        <div>
          <label>Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="supplier">Supplier</option>
            <option value="supermarket">Supermarket</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div>
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="all">All</option>
          </select>
        </div>

        <button className="btn" onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading users...</p>}
      {error && <p className="admin-error">{error}</p>}

      {!loading && users.length === 0 && (
        <p className="admin-text-muted">No users found.</p>
      )}

      {users.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Approved</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isApproved ? "Yes" : "No"}</td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
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
