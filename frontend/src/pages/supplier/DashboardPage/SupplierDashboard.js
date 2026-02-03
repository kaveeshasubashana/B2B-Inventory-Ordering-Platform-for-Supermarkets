
import React, { useEffect, useState } from "react";
import axios from "../../../api/axiosInstance";
import { useNavigate } from "react-router-dom";
import "./SupplierDashboard.css";
import SupplierSidebar from "../Suppliersidebar";
import "../Suppliersidebar.css";
import SupplierTopbar from "../SupplierTopbar";
import "../SupplierTopbar.css";


import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];
const GRADIENTS = [
  { id: "greenGradient", start: "#10b981", end: "#6ee7b7" },
  { id: "blueGradient", start: "#3b82f6", end: "#93c5fd" },
  { id: "yellowGradient", start: "#f59e0b", end: "#fcd34d" },
];


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
};


const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const SupplierDashboard = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productRes, orderRes, statsRes] = await Promise.all([
          axios.get("/products/my-products"),
          axios.get("/orders/supplier"),

          axios.get("/products/dashboard-stats").catch(() => ({ data: {} })),
        ]);

        setProducts(productRes.data);
        setOrders(orderRes.data);
        setStats(statsRes.data || {}); 
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );

  

  const totalProducts = stats.totalProducts || products.length || 0;
  const activeProducts =
    stats.activeProducts ||
    products.filter((p) => p.isActive !== false).length ||
    0;
  const lowStockProducts =
    stats.lowStock || products.filter((p) => p.stock <= 10).length || 0;

  
  const stockData = [
    { name: "Good Stock", value: products.filter((p) => p.stock > 20).length },
    {
      name: "Medium Stock",
      value: products.filter((p) => p.stock > 10 && p.stock <= 20).length,
    },
    { name: "Low Stock", value: lowStockProducts },
  ];

  
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const ordersByMonth = {};


  monthNames.forEach((month) => {
    ordersByMonth[month] = 0;
  });

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const month = monthNames[date.getMonth()];
    ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
  });

  const monthlyOrdersData = monthNames.map((month) => ({
    month,
    orders: ordersByMonth[month],
  }));

 
  const lowStockProductsList = products
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="supplier-layout">
      <SupplierSidebar />
      <div className="supplier-main-content">
        <SupplierTopbar />
        <div className="supplier-dashboard">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">Dashboard</h1>
              <p className="dashboard-subtitle">
                Welcome back! Here's an overview of your inventory and orders.
              </p>
            </div>
          </div>

          
          <div className="stats-grid">
            <div className="dash-card purple">
              <div className="dash-card-top">
                <div className="dash-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <div className="dash-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="dash-card-content">
                <div className="dash-card-label">Total Products</div>
                <div className="dash-card-value">{totalProducts.toLocaleString()}</div>
              </div>
            </div>

            
            <div className="dash-card green">
              <div className="dash-card-top">
                <div className="dash-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="dash-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="dash-card-content">
                <div className="dash-card-label">Active Products</div>
                <div className="dash-card-value">{activeProducts.toLocaleString()}</div>
              </div>
            </div>

            
            <div className="dash-card yellow">
              <div className="dash-card-top">
                <div className="dash-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div className="dash-card-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div className="dash-card-content">
                <div className="dash-card-label">Low Stock Items</div>
                <div className="dash-card-value">{lowStockProducts}</div>
              </div>
            </div>
          </div>

          
          <div className="charts-container">
            <div className="chart-card">
              <div className="chart-header">
                <div className="chart-header-icon pie-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
                  </svg>
                </div>
                <h3 className="chart-title">Stock Overview</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <defs>
                    {GRADIENTS.map((g, i) => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={g.start} />
                        <stop offset="100%" stopColor={g.end} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={3}
                    labelLine={false}
                    label={renderCustomPieLabel}
                  >
                    {stockData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#${GRADIENTS[index % GRADIENTS.length].id})`}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      padding: "12px 16px",
                    }}
                    formatter={(value, name) => [`${value} items`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            
            <div className="chart-card chart-card-wide">
              <div className="chart-header">
                <div className="chart-header-icon area-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <h3 className="chart-title">Monthly Orders</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyOrdersData}>
                  <defs>
                    <linearGradient id="orderGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#orderGradient)"
                    dot={{ fill: "#fff", stroke: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "#3b82f6", stroke: "#fff", strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          
          
          <div className="quick-actions">
            <h3 className="section-title">Quick Actions</h3>

            <div className="action-buttons">
              <button
                className="qa-pill qa-green"
                onClick={() => navigate("/supplier/products")}
              >
                <span className="qa-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  </svg>
                </span>
                <span className="qa-text">Manage Products</span>
                <span className="qa-chevron">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </button>

              <button
                className="qa-pill qa-blue"
                onClick={() =>
                  navigate("/supplier/products", { state: { openAdd: true } })
                }
              >
                <span className="qa-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </span>
                <span className="qa-text">Add New Product</span>
                <span className="qa-chevron">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </button>

              <button
                className="qa-pill qa-outline"
                onClick={() => navigate("/supplier/orders")}
              >
                <span className="qa-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                </span>
                <span className="qa-text">View Incoming Orders</span>
                <span className="qa-chevron">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          
          <div className="low-stock-section">
            <div className="section-header">
              <div className="section-icon">⚠️</div>
              <h3 className="section-title">Low Stock Products</h3>
            </div>

            {lowStockProductsList.length > 0 ? (
              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUCT NAME</th>
                      <th>CATEGORY</th>
                      <th>STOCK</th>
                      <th>PRICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProductsList.map((product) => (
                      <tr key={product._id}>
                        <td className="product-name">{product.name}</td>
                        <td className="product-category">
                          {product.category || "N/A"}
                        </td>
                        <td>
                          <span
                            className={`stock-badge ${
                              product.stock <= 5
                                ? "stock-critical"
                                : product.stock <= 10
                                ? "stock-low"
                                : "stock-medium"
                            }`}
                          >
                            {product.stock} units
                          </span>
                        </td>

                        <td className="product-price">
                          Rs.{product.price?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data-message">
                All products are well stocked! 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDashboard;
