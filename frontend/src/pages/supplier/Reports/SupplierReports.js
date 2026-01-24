import React, { useEffect, useMemo, useState } from "react";
import axios from "../../../api/axiosInstance";
import "./SupplierReports.css";
import SupplierSidebar from "../Suppliersidebar";
import SupplierTopbar from "../SupplierTopbar";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

// If recharts not installed:
// npm i recharts

const STATUSES = ["All", "Pending", "Confirmed", "Delivered", "Cancelled"];

function formatLKR(value) {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function formatCompactLKR(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `Rs. ${(n / 1_000).toFixed(0)}K`;
  return formatLKR(n);
}

function toISODate(d) {
  // yyyy-mm-dd in local time
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

function getPresetRange(presetKey) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (presetKey === "today") {
    // start/end = today
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  if (presetKey === "week") {
    // last 7 days (including today)
    start.setDate(start.getDate() - 6);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  if (presetKey === "month") {
    // from 1st of current month
    start.setDate(1);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  if (presetKey === "year") {
    start.setMonth(0, 1);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  return { startDate: "", endDate: "" };
}

function downloadCSV(filename, rows, columns) {
  // columns: [{ header, key, format?: fn }]
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.key === "function" ? c.key(row) : row[c.key];
          const val = c.format ? c.format(raw, row) : raw;
          const safe = String(val ?? "").replace(/"/g, '""');
          return `"${safe}"`;
        })
        .join(",")
    )
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SupplierReports() {
  // Range controls
  const [preset, setPreset] = useState("today"); // today | week | month | year | custom
  const [status, setStatus] = useState("All");

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Apply button (so custom dates don’t refetch every keypress)
  const [appliedStart, setAppliedStart] = useState(
    getPresetRange("today").startDate
  );
  const [appliedEnd, setAppliedEnd] = useState(getPresetRange("today").endDate);

  // Buyers filters
  const [buyerSearch, setBuyerSearch] = useState("");
  const [buyerDistrict, setBuyerDistrict] = useState("All Districts");

  // Products filter
  const [productSearch, setProductSearch] = useState("");

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    cancelledOrders: 0,
  });

  const [revenueOverTime, setRevenueOverTime] = useState([]); // [{label, revenue, orders}]
  const [ordersByStatus, setOrdersByStatus] = useState([]); // [{status, count}]
  const [topBuyers, setTopBuyers] = useState([]); // [{buyerName, district, orders, revenue, lastOrderDate}]
  const [topProducts, setTopProducts] = useState([]); // [{productName, category, qtySold, revenue, stockLeft}]

  const districts = useMemo(() => {
    const set = new Set(topBuyers.map((b) => b.district).filter(Boolean));
    return ["All Districts", ...Array.from(set)];
  }, [topBuyers]);

  // When preset changes (not custom), auto-apply dates
  useEffect(() => {
    if (preset !== "custom") {
      const { startDate, endDate } = getPresetRange(preset);
      setAppliedStart(startDate);
      setAppliedEnd(endDate);
      setCustomStart(startDate);
      setCustomEnd(endDate);
    }
  }, [preset]);

  const canApplyCustom = useMemo(() => {
    if (preset !== "custom") return true;
    if (!customStart || !customEnd) return false;
    return customEnd >= customStart;
  }, [preset, customStart, customEnd]);

  const queryParams = useMemo(() => {
    const params = {
      status,
    };

    // Only send dates if available
    if (appliedStart) params.startDate = appliedStart;
    if (appliedEnd) params.endDate = appliedEnd;

    return params;
  }, [status, appliedStart, appliedEnd]);

  // Fetch all report blocks
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [sumRes, revRes, statusRes, buyersRes, productsRes] =
          await Promise.all([
            axios.get("/reports/supplier/summary", { params: queryParams }),
            axios.get("/reports/supplier/revenue-over-time", {
              params: { ...queryParams, granularity: "month" },
            }),
            axios.get("/reports/supplier/orders-by-status", {
              params: queryParams,
            }),
            axios.get("/reports/supplier/top-buyers", {
              params: { ...queryParams, limit: 10 },
            }),
            axios.get("/reports/supplier/top-products", {
              params: { ...queryParams, limit: 10 },
            }),
          ]);

        if (!alive) return;

        setSummary(sumRes.data || {});
        setRevenueOverTime(Array.isArray(revRes.data) ? revRes.data : []);
        setOrdersByStatus(Array.isArray(statusRes.data) ? statusRes.data : []);
        setTopBuyers(Array.isArray(buyersRes.data) ? buyersRes.data : []);
        setTopProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (e) {
        if (!alive) return;
        setError(
          e?.response?.data?.message || e.message || "Failed to load reports"
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [queryParams]);

  const visibleBuyers = useMemo(() => {
    return topBuyers
      .filter((b) =>
        buyerDistrict === "All Districts" ? true : b.district === buyerDistrict
      )
      .filter((b) =>
        buyerSearch.trim()
          ? (b.buyerName || "")
              .toLowerCase()
              .includes(buyerSearch.toLowerCase())
          : true
      );
  }, [topBuyers, buyerDistrict, buyerSearch]);

  const visibleProducts = useMemo(() => {
    return topProducts.filter((p) =>
      productSearch.trim()
        ? (p.productName || "")
            .toLowerCase()
            .includes(productSearch.toLowerCase())
        : true
    );
  }, [topProducts, productSearch]);

  function handleApply() {
    if (preset !== "custom") return;
    if (!canApplyCustom) return;

    setAppliedStart(customStart);
    setAppliedEnd(customEnd);
  }

  function exportSummaryCSV() {
    const rows = [
      {
        range: preset,
        status,
        startDate: appliedStart,
        endDate: appliedEnd,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
        deliveredOrders: summary.deliveredOrders,
        pendingOrders: summary.pendingOrders,
        confirmedOrders: summary.confirmedOrders,
        cancelledOrders: summary.cancelledOrders,
      },
    ];

    downloadCSV("supplier-sales-summary.csv", rows, [
      { header: "Range", key: "range" },
      { header: "Status", key: "status" },
      { header: "Start Date", key: "startDate" },
      { header: "End Date", key: "endDate" },
      { header: "Total Orders", key: "totalOrders" },
      { header: "Total Revenue", key: "totalRevenue" },
      { header: "Delivered Orders", key: "deliveredOrders" },
      { header: "Pending Orders", key: "pendingOrders" },
      { header: "Confirmed Orders", key: "confirmedOrders" },
      { header: "Cancelled Orders", key: "cancelledOrders" },
    ]);
  }

  function exportBuyersCSV() {
    downloadCSV("top-buyers.csv", visibleBuyers, [
      { header: "Buyer", key: "buyerName" },
      { header: "District", key: "district" },
      { header: "Orders", key: "orders" },
      { header: "Revenue", key: "revenue" },
      {
        header: "Last Order Date",
        key: (r) =>
          r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString() : "",
      },
      { header: "Email", key: "email" },
    ]);
  }

  function exportProductsCSV() {
    downloadCSV("top-products.csv", visibleProducts, [
      { header: "Product", key: "productName" },
      { header: "Category", key: "category" },
      { header: "Qty Sold", key: "qtySold" },
      { header: "Revenue", key: "revenue" },
      { header: "Stock Left", key: "stockLeft" },
    ]);
  }

  // Simple “PDF” placeholder: export a text file.
  // If you want real PDF later, we can add jspdf.
  function exportPDFPlaceholder() {
    const content = [
      "Supplier Reports",
      `Range: ${preset}`,
      `Status: ${status}`,
      `Start: ${appliedStart || "-"}`,
      `End: ${appliedEnd || "-"}`,
      "",
      `Total Orders: ${summary.totalOrders}`,
      `Total Revenue: ${formatLKR(summary.totalRevenue)}`,
      `Delivered: ${summary.deliveredOrders}`,
      `Pending: ${summary.pendingOrders}`,
      `Confirmed: ${summary.confirmedOrders}`,
      `Cancelled: ${summary.cancelledOrders}`,
      "",
      "Generated by SupplyHub",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "supplier-report.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="supplier-layout">
      <SupplierSidebar />
      <div className="supplier-main-content">
        <SupplierTopbar />
        <div className="sr-page">
          <div className="sr-header">
            <div>
              <h1 className="sr-title">Reports</h1>
              <p className="sr-subtitle">
                Sales analytics for your supplier account.
              </p>
            </div>
          </div>

          <div className="sr-filters">
            <div className="sr-filter-row">
              <div className="sr-chips">
                <button
                  className={`sr-chip ${preset === "today" ? "active" : ""}`}
                  onClick={() => setPreset("today")}
                >
                  Today
                </button>
                <button
                  className={`sr-chip ${preset === "week" ? "active" : ""}`}
                  onClick={() => setPreset("week")}
                >
                  This Week
                </button>
                <button
                  className={`sr-chip ${preset === "month" ? "active" : ""}`}
                  onClick={() => setPreset("month")}
                >
                  This Month
                </button>
                <button
                  className={`sr-chip ${preset === "year" ? "active" : ""}`}
                  onClick={() => setPreset("year")}
                >
                  This Year
                </button>
                <button
                  className={`sr-chip ${preset === "custom" ? "active" : ""}`}
                  onClick={() => setPreset("custom")}
                >
                  Custom
                </button>
              </div>

              <div className="sr-actions">
                <button
                  className="sr-btn"
                  onClick={exportSummaryCSV}
                  disabled={loading}
                >
                  Export CSV
                </button>
                <button
                  className="sr-btn"
                  onClick={exportPDFPlaceholder}
                  disabled={loading}
                >
                  Export PDF
                </button>
              </div>
            </div>

            <div className="sr-filter-row">
              <div className="sr-control">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option value={s} key={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {preset === "custom" && (
                <div className="sr-custom">
                  <div className="sr-control">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="sr-control">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                  <button
                    className={`sr-btn sr-btn-primary ${
                      !canApplyCustom ? "disabled" : ""
                    }`}
                    onClick={handleApply}
                    disabled={!canApplyCustom || loading}
                  >
                    Apply
                  </button>
                  {!canApplyCustom && (
                    <div className="sr-error-inline">
                      Select a valid start & end date.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <div className="sr-alert">{error}</div>}

          <div className="sr-grid sr-grid-4">
            <div className="sr-card">
              <div className="sr-card-top">
                <div className="sr-card-title">Total Orders</div>
                <div className="sr-icon-badge blue">📦</div>
              </div>
              <div className="sr-card-value">
                {loading ? "—" : summary.totalOrders}
              </div>
              <div className="sr-card-note green">
                +12.5% <span>vs previous period</span>
              </div>
            </div>

            <div className="sr-card">
              <div className="sr-card-top">
                <div className="sr-card-title">Total Revenue</div>
                <div className="sr-icon-badge green">💰</div>
              </div>
              <div className="sr-card-value">
                {loading ? "—" : formatCompactLKR(summary.totalRevenue)}
              </div>
              <div className="sr-card-note green">
                +18.2% <span>vs previous period</span>
              </div>
            </div>

            <div className="sr-card">
              <div className="sr-card-top">
                <div className="sr-card-title">Delivered Orders</div>
                <div className="sr-icon-badge pink">🚚</div>
              </div>
              <div className="sr-card-value">
                {loading ? "—" : summary.deliveredOrders}
              </div>
              <div className="sr-card-note green">
                +8.4% <span>vs previous period</span>
              </div>
            </div>

            <div className="sr-card">
              <div className="sr-card-top">
                <div className="sr-card-title">Pending Orders</div>
                <div className="sr-icon-badge orange">⏳</div>
              </div>
              <div className="sr-card-value">
                {loading ? "—" : summary.pendingOrders}
              </div>
              <div className="sr-card-note red">
                -3.2% <span>vs previous period</span>
              </div>
            </div>
          </div>

          <div className="sr-grid sr-grid-2">
            <div className="sr-card sr-card-pad">
              <div className="sr-section-title">Revenue Over Time</div>
              <div className="sr-section-subtitle">Monthly revenue trends</div>

              <div className="sr-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatLKR(v)} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="sr-card sr-card-pad">
              <div className="sr-section-title">Orders by Status</div>
              <div className="sr-section-subtitle">
                Order status distribution
              </div>

              <div className="sr-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Buyers */}
          <div className="sr-card sr-card-pad">
            <div className="sr-table-header">
              <div>
                <div className="sr-section-title">Top Buyers</div>
                <div className="sr-section-subtitle">
                  Your best performing buyers
                </div>
              </div>

              <div className="sr-table-controls">
                <button
                  className="sr-btn"
                  onClick={exportBuyersCSV}
                  disabled={loading}
                >
                  Export CSV
                </button>

                <div className="sr-input-wrap">
                  <span className="sr-input-icon">🔎</span>
                  <input
                    value={buyerSearch}
                    onChange={(e) => setBuyerSearch(e.target.value)}
                    placeholder="Search buyers..."
                  />
                </div>

                <select
                  value={buyerDistrict}
                  onChange={(e) => setBuyerDistrict(e.target.value)}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>District</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Last Order</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    visibleBuyers.map((b) => (
                      <tr key={b.buyerId || b.buyerName}>
                        <td className="strong">{b.buyerName}</td>
                        <td>
                          <span className="sr-pill">{b.district || "-"}</span>
                        </td>
                        <td className="strong">{b.orders}</td>
                        <td className="strong">{formatLKR(b.revenue)}</td>
                        <td>
                          {b.lastOrderDate
                            ? new Date(b.lastOrderDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <button
                            className="sr-btn-mini"
                            onClick={() => alert(`View: ${b.buyerName}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                  {!loading && visibleBuyers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="sr-empty">
                        No buyers found.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan="6" className="sr-empty">
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="sr-card sr-card-pad">
            <div className="sr-table-header">
              <div>
                <div className="sr-section-title">Top Products</div>
                <div className="sr-section-subtitle">
                  Best selling products by quantity
                </div>
              </div>

              <div className="sr-table-controls">
                <button
                  className="sr-btn"
                  onClick={exportProductsCSV}
                  disabled={loading}
                >
                  Export CSV
                </button>

                <div className="sr-input-wrap">
                  <span className="sr-input-icon">🔎</span>
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                  />
                </div>
              </div>
            </div>

            <div className="sr-table-wrap">
              <table className="sr-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Qty Sold</th>
                    <th>Revenue</th>
                    <th>Stock Left</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading &&
                    visibleProducts.map((p) => (
                      <tr key={p.productId || p.productName}>
                        <td className="strong">{p.productName}</td>
                        <td>
                          <span className="sr-pill">{p.category || "-"}</span>
                        </td>
                        <td className="strong">
                          {Number(p.qtySold || 0).toLocaleString("en-LK")}
                        </td>
                        <td className="strong">{formatLKR(p.revenue)}</td>
                        <td className="strong">
                          {Number(p.stockLeft || 0).toLocaleString("en-LK")}
                        </td>
                        <td>
                          <button
                            className="sr-btn-mini"
                            onClick={() =>
                              alert(`View product: ${p.productName}`)
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}

                  {!loading && visibleProducts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="sr-empty">
                        No products found.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td colSpan="6" className="sr-empty">
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sr-footer-space" />
        </div>
      </div>
    </div>
  );
}
