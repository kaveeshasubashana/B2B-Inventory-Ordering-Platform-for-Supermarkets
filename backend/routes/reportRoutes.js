const express = require("express");
const router = express.Router();

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getSupplierReportSummary,
  getSupplierRevenueOverTime,
  getSupplierOrdersByStatus,
  getSupplierTopBuyers,
  getSupplierTopProducts,
} = require("../controllers/reportController");

// All supplier reports
router.use(protect, authorizeRoles("supplier"));

router.get("/supplier/summary", getSupplierReportSummary);
router.get("/supplier/revenue-over-time", getSupplierRevenueOverTime);
router.get("/supplier/orders-by-status", getSupplierOrdersByStatus);
router.get("/supplier/top-buyers", getSupplierTopBuyers);
router.get("/supplier/top-products", getSupplierTopProducts);

module.exports = router;
