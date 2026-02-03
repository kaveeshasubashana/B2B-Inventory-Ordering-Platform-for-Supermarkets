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

const IconCart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M6 6h15l-1.5 8H7.2L6 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6 6 5 3H2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="9" cy="20" r="1.6" fill="currentColor" />
    <circle cx="18" cy="20" r="1.6" fill="currentColor" />
  </svg>
);

const IconDollar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2v20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M16 7.5c0-1.9-1.8-3.5-4-3.5s-4 1.1-4 3 1.5 2.7 4 3 4 1.2 4 3-1.8 3.5-4 3.5-4-1.6-4-3.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconTruck = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h12v10H3V6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M15 10h4l2 2v4h-6v-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="7" cy="18" r="1.6" fill="currentColor" />
    <circle cx="18" cy="18" r="1.6" fill="currentColor" />
  </svg>
);

const IconClock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v6l4 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const STATUSES = ["All", "Pending", "Accepted", "Dispatched", "Delivered", "Rejected"];

function formatLKR(value) {
  const n = Number(value || 0);
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function toISODate(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

function getPresetRange(presetKey) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (presetKey === "today") return { startDate: toISODate(start), endDate: toISODate(end) };

  if (presetKey === "week") {
    start.setDate(start.getDate() - 6);
    return { startDate: toISODate(start), endDate: toISODate(end) };
  }

  if (presetKey === "month") {
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
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const raw = typeof c.key === "function" ? c.key(row) : row[c.key];
          const safe = String(raw ?? "").replace(/"/g, '""');
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
  const [preset, setPreset] = useState("today");
  const [status, setStatus] = useState("All");

  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedStart, setAppliedStart] = useState(getPresetRange("today").startDate);
  const [appliedEnd, setAppliedEnd] = useState(getPresetRange("today").endDate);

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

  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [topBuyers, setTopBuyers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

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
    const params = { status };
    if (appliedStart) params.startDate = appliedStart;
    if (appliedEnd) params.endDate = appliedEnd;
    return params;
  }, [status, appliedStart, appliedEnd]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [sumRes, revRes, statusRes, buyersRes, productsRes] = await Promise.all([
          axios.get("/reports/supplier/summary", { params: queryParams }),
          axios.get("/reports/supplier/revenue-over-time", {
            params: { ...queryParams, granularity: "month" },
          }),
          axios.get("/reports/supplier/orders-by-status", { params: queryParams }),
          axios.get("/reports/supplier/top-buyers", { params: { ...queryParams, limit: 5 } }),
          axios.get("/reports/supplier/top-products", { params: { ...queryParams, limit: 5 } }),
        ]);

        if (!alive) return;

        setSummary(sumRes.data || {});
        setRevenueOverTime(Array.isArray(revRes.data) ? revRes.data : []);
        setOrdersByStatus(Array.isArray(statusRes.data) ? statusRes.data : []);
        setTopBuyers(Array.isArray(buyersRes.data) ? buyersRes.data : []);
        setTopProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || e.message || "Failed to load reports");
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

  function applyCustom() {
    if (!canApplyCustom) return;
    setAppliedStart(customStart);
    setAppliedEnd(customEnd);
  }

  function exportCSV() {
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
      },
    ];

    downloadCSV("supplier-report.csv", rows, [
      { header: "Range", key: "range" },
      { header: "Status", key: "status" },
      { header: "Start Date", key: "startDate" },
      { header: "End Date", key: "endDate" },
      { header: "Total Orders", key: "totalOrders" },
      { header: "Total Revenue", key: "totalRevenue" },
      { header: "Delivered Orders", key: "deliveredOrders" },
      { header: "Pending Orders", key: "pendingOrders" },
    ]);
  }

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
      `Delivered Orders: ${summary.deliveredOrders}`,
      `Pending Orders: ${summary.pendingOrders}`,
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

        <div className="rep-page">
          <div className="rep-head">
            <div>
              <div className="rep-title-wrapper">
                <span className="rep-title-dot"></span>
                <h1 className="rep-title">Reports</h1>
              </div>
              <div className="rep-sub">Sales analytics overview</div>
            </div>

            <div className="rep-head-right">
              <select className="rep-select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {preset === "custom" && (
            <div className="rep-custom">
              <div className="rep-field">
                <label>Start Date</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              </div>
              <div className="rep-field">
                <label>End Date</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
              </div>
              <button className="rep-btn rep-btn-primary" onClick={applyCustom} disabled={!canApplyCustom || loading}>
                Apply
              </button>
              {!canApplyCustom && <div className="rep-warn">Select a valid range</div>}
            </div>
          )}

          {error && <div className="rep-error">{error}</div>}

          <div className="rep-cards">
            <div className="rep-card green">
              <div className="rep-card-top">
                <div className="rep-card-icon">
                  <IconCart />
                </div>
                <div className="rep-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="rep-card-content">
                <div className="rep-card-label">Total Orders</div>
                <div className="rep-card-value">{loading ? "—" : summary.totalOrders}</div>
              </div>
            </div>

            <div className="rep-card blue">
              <div className="rep-card-top">
                <div className="rep-card-icon">
                  <IconDollar />
                </div>
                <div className="rep-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="rep-card-content">
                <div className="rep-card-label">Total Revenue</div>
                <div className="rep-card-value">{loading ? "—" : formatLKR(summary.totalRevenue)}</div>
              </div>
            </div>

            <div className="rep-card purple">
              <div className="rep-card-top">
                <div className="rep-card-icon">
                  <IconTruck />
                </div>
                <div className="rep-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="rep-card-content">
                <div className="rep-card-label">Delivered Orders</div>
                <div className="rep-card-value">{loading ? "—" : summary.deliveredOrders}</div>
              </div>
            </div>

            <div className="rep-card yellow">
              <div className="rep-card-top">
                <div className="rep-card-icon">
                  <IconClock />
                </div>
                <div className="rep-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="rep-card-content">
                <div className="rep-card-label">Pending Orders</div>
                <div className="rep-card-value">{loading ? "—" : summary.pendingOrders}</div>
              </div>
            </div>
          </div>

          <div className="rep-charts">
            <div className="rep-panel">
              <div className="rep-panel-title">Revenue Over Time</div>

              <div className="rep-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueOverTime} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                        fontSize: 13,
                      }}
                      formatter={(v) => [formatLKR(v), "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rep-panel">
              <div className="rep-panel-title">Orders by Status</div>

              <div className="rep-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByStatus} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="status" 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={12}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
                        fontSize: 13,
                      }}
                      formatter={(v) => [v, "Orders"]}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981" 
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rep-panel">
            <div className="rep-panel-title">Top Performers</div>

            <div className="rep-two">
              <div>
                <div className="rep-mini-title">Top Buyers</div>

                <div className="rep-list">
                  {(loading ? [] : topBuyers).slice(0, 3).map((b) => (
                    <div className="rep-list-item" key={b.buyerId || b.buyerName}>
                      <div className="rep-list-left">{b.buyerName || "-"}</div>
                      <div className="rep-list-right">{formatLKR(b.revenue)}</div>
                    </div>
                  ))}

                  {!loading && topBuyers.length === 0 && <div className="rep-empty">No buyers data</div>}
                  {loading && <div className="rep-empty">Loading...</div>}
                </div>
              </div>

              <div>
                <div className="rep-mini-title">Top Products</div>

                <div className="rep-list">
                  {(loading ? [] : topProducts).slice(0, 3).map((p) => (
                    <div className="rep-list-item" key={p.productId || p.productName}>
                      <div className="rep-list-left">{p.productName || "-"}</div>
                      <div className="rep-list-right">
                        {Number(p.qtySold || 0).toLocaleString("en-LK")} units
                      </div>
                    </div>
                  ))}

                  {!loading && topProducts.length === 0 && <div className="rep-empty">No products data</div>}
                  {loading && <div className="rep-empty">Loading...</div>}
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}
