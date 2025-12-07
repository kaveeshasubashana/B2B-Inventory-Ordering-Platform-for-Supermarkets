// frontend/src/pages/AdminPendingUsersPage.js
import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";

const AdminPendingUsersPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/admin/pending-users");
      setPendingUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (id) => {
    try {
      await api.patch(`/admin/approve/${id}`);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || "Approve failed");
    }
  };

  const rejectUser = async (id) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    try {
      await api.patch(`/admin/reject/${id}`);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || "Reject failed");
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="admin-page">
      <h2 className="admin-header-title">Pending Users</h2>
      <p className="admin-header-subtitle">
        Approve or reject newly registered suppliers and supermarkets.
      </p>

      {loading && <p>Loading...</p>}
      {error && <p className="admin-error">{error}</p>}
      {!loading && pendingUsers.length === 0 && (
        <p className="admin-text-muted">No pending users.</p>
      )}

      {pendingUsers.length > 0 && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      style={{ marginRight: 8 }}
                      onClick={() => approveUser(u._id)}
                    >
                      Approve
                    </button>
                    <button className="btn" onClick={() => rejectUser(u._id)}>
                      Reject
                    </button>
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

export default AdminPendingUsersPage;
