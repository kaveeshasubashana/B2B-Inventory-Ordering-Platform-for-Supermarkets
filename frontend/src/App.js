// frontend/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import UserProfile from "./pages/profile/UserProfile";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminPendingUsersPage from "./pages/AdminPendingUsersPage";
import AdminUsersPage from "./pages/AdminUsersPage";

// Supplier Pages
import SupplierDashboard from "./pages/supplier/DashboardPage/SupplierDashboard";
import SupplierOrders from "./pages/supplier/OrderPage/SupplierOrders";
import ViewProducts from "./pages/supplier/ProductPage/ViewProducts";
import SupplierBuyers from "./pages/supplier/SupplierBuyers/SupplierBuyers";
import SupplierReports from "./pages/supplier/Reports/SupplierReports";


// Supermarket Pages
import SupermarketDashboard from "./pages/supermarket/SupermarketDashboard";
import SupermarketMyOrders from "./pages/supermarket/SupermarketMyOrders";

// Layout with Navbar
const MainLayout = () => {
  return (
    <>
      <Navbar />
      <div className="container">
        <Outlet />
      </div>
    </>
  );
};

// Routes + Footer control
const AppRoutes = () => {
  const location = useLocation();

  // ✅ HIDE footer for supplier, supermarket AND admin
  const hideFooter =
    location.pathname.startsWith("/supplier") ||
    location.pathname.startsWith("/supermarket") ||
    location.pathname.startsWith("/admin");

  return (
    <>
      <Routes>
        {/* Routes WITH navbar */}
        <Route element={<MainLayout />}>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pending" element={<PendingApprovalPage />} />

          {/* 🔐 Admin */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route
              path="/admin/pending-users"
              element={<AdminPendingUsersPage />}
            />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* 🔐 Supermarket */}
          <Route element={<PrivateRoute allowedRoles={["supermarket"]} />}>
            <Route
              path="/supermarket/dashboard"
              element={<SupermarketDashboard />}
            />
            <Route
              path="/supermarket/my-orders"
              element={<SupermarketMyOrders />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
           <Route path="/supermarket/profile" element={<UserProfile />} />
          
        </Route>

        {/* SUPPLIER AREA (no navbar, no footer) */}
        <Route element={<PrivateRoute allowedRoles={["supplier"]} />}>
          <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
          <Route path="/supplier/products" element={<ViewProducts />} />
          <Route path="/supplier/orders" element={<SupplierOrders />} />
          <Route path="/supplier/supermarkets" element={<SupplierBuyers />} />
          <Route path="/supplier/reports" element={<SupplierReports />} />
          <Route path="/supplier/profile" element={<UserProfile />} />
        
        </Route>
      </Routes>

      {/* ✅ Footer hidden for admin, supplier, supermarket */}
      {!hideFooter && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
