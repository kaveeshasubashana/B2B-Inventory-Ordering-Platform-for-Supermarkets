// frontend/src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import AdminStatsCharts from "../components/AdminStatsCharts.jsx";
import "./AdminDashboard.css"; // Make sure to import the CSS

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");

  // 📊 Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setError("");
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  };

  // 📄 Download CSV report
  const downloadReport = async () => {
    try {
      const res = await api.get("/admin/users-report", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users-report.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download report");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Helper: Icons
  const IconUsers = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
  const IconTruck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>;
  const IconStore = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
  const IconPending = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
  const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
  const IconDownload = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="dashboard-title">Admin Overview</h2>
        <p className="dashboard-subtitle">
          Real-time system insights and user management controls.
        </p>
      </div>

      {loadingStats && <div className="loading-state">Syncing dashboard data...</div>}
      {error && <div className="error-message">Error: {error}</div>}

      {stats && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            {/* Total Users */}
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{stats.totalUsers}</span>
              </div>
              <div className="stat-icon-wrapper icon-blue">
                <IconUsers />
              </div>
            </div>

            {/* Suppliers */}
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Suppliers</span>
                <span className="stat-value">{stats.totalSuppliers}</span>
              </div>
              <div className="stat-icon-wrapper icon-indigo">
                <IconTruck />
              </div>
            </div>

            {/* Supermarkets */}
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Supermarkets</span>
                <span className="stat-value">{stats.totalSupermarkets}</span>
              </div>
              <div className="stat-icon-wrapper icon-teal">
                <IconStore />
              </div>
            </div>

            {/* Pending */}
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Pending Approval</span>
                <span className="stat-value">{stats.pendingUsers}</span>
              </div>
              <div className="stat-icon-wrapper icon-orange">
                <IconPending />
              </div>
            </div>

            {/* Approved */}
            <div className="stat-card">
              <div className="stat-content">
                <span className="stat-label">Active Users</span>
                <span className="stat-value">{stats.approvedUsers}</span>
              </div>
              <div className="stat-icon-wrapper icon-green">
                <IconCheck />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="chart-section">
            <h3 className="section-title">Analytics & Trends</h3>
            <AdminStatsCharts stats={stats} />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="actions-section">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <button
            className="btn-dashboard btn-primary"
            onClick={() => navigate("/admin/pending-users")}
          >
            Manage Pending Users
          </button>

          <button
            className="btn-dashboard btn-secondary"
            onClick={() => navigate("/admin/users")}
          >
            Manage Suppliers & Supermarkets
          </button>

          <button 
            className="btn-dashboard btn-outline" 
            onClick={downloadReport}
            title="Download CSV"
          >
            <IconDownload /> Export User Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;