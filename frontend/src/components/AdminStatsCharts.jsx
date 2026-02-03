// frontend/src/components/AdminStatsCharts.jsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const AdminStatsCharts = ({ stats }) => {
  if (!stats) return null;

  const roleData = [
    { name: "Suppliers", value: stats.totalSuppliers },
    { name: "Supermarkets", value: stats.totalSupermarkets },
  ];

  const approvalData = [
    { name: "Approved", value: stats.approvedUsers },
    { name: "Pending", value: stats.pendingUsers },
  ];

  const COLORS = ["#8884d8", "#82ca9d"];

  return (
    <div style={{ marginTop: "30px", display: "flex", gap: "40px", flexWrap: "wrap" }}>
      {/* Bar chart for roles */}
      <div>
        <h4>Suppliers vs Supermarkets</h4>
        <BarChart width={400} height={250} data={roleData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value">
            {roleData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </div>

      {/* Pie chart for approval */}
      <div>
        <h4>Approved vs Pending Users</h4>
        <PieChart width={400} height={250}>
          <Pie
            data={approvalData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {approvalData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
};

export default AdminStatsCharts;
