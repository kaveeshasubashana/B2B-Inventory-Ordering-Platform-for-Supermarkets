import React, { useEffect, useMemo, useState } from "react";
import SupplierSidebar from "../Suppliersidebar";
import SupplierTopbar from "../SupplierTopbar";
import axios from "../../../api/axiosInstance";
import "./SupplierOrders.css";

const toUiStatus = (s) => {
  const v = (s || "").toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "approved") return "Approved";
  if (v === "rejected") return "Rejected";
  if (v === "dispatched") return "Dispatched";
  if (v === "delivered") return "Delivered";
  return "Pending";
};

const SupplierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/orders/supplier");
        const list = Array.isArray(res.data) ? res.data : [];
        setOrders(
          list.map((o) => ({
            ...o,
            uiStatus: toUiStatus(o.status),
          }))
        );
      } catch (err) {
        setErrorMsg("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab =
        activeTab === "All" || o.uiStatus === activeTab;
      const name = o?.supermarket?.name || "";
      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o._id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm]);

  const stats = useMemo(() => {
    return {
      pending: orders.filter((o) => o.uiStatus === "Pending").length,
      revenue: orders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      ),
    };
  }, [orders]);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, status, uiStatus: toUiStatus(status) } : o
        )
      );
      setSelectedOrder(null);
    } catch {
      alert("Status update failed");
    }
  };

  const badgeClass = (s) =>
    s === "Pending"
      ? "badge-pending"
      : s === "Approved"
      ? "badge-approved"
      : s === "Rejected"
      ? "badge-cancelled"
      : s === "Dispatched"
      ? "badge-out_for_delivery"
      : s === "Delivered"
      ? "badge-delivered"
      : "";

  return (
    <div className="supplier-layout">
      <SupplierSidebar />
      <div className="supplier-main-content">
        <SupplierTopbar />

        <div className="orders-page-container">
          <h1>Order Management</h1>

          <div className="header-stats">
            <div>Pending: {stats.pending}</div>
            <div>Revenue: Rs. {stats.revenue.toLocaleString()}</div>
          </div>

          <div className="controls-section">
            {["All", "Pending", "Approved", "Dispatched", "Delivered", "Rejected"].map(
              (t) => (
                <button
                  key={t}
                  className={activeTab === t ? "active" : ""}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              )
            )}

            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : errorMsg ? (
            <p>{errorMsg}</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td>ORD-{o._id.slice(-6)}</td>
                    <td>{o?.supermarket?.name || "Unknown"}</td>
                    <td>Rs. {o.totalAmount}</td>
                    <td>
                      <span className={`status-badge ${badgeClass(o.uiStatus)}`}>
                        {o.uiStatus}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setSelectedOrder(o)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Order {selectedOrder._id.slice(-6)}</h3>

            {selectedOrder.uiStatus === "Pending" && (
              <>
                <button onClick={() => updateStatus(selectedOrder._id, "approved")}>
                  Approve
                </button>
                <button onClick={() => updateStatus(selectedOrder._id, "rejected")}>
                  Reject
                </button>
              </>
            )}

            <button onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;
