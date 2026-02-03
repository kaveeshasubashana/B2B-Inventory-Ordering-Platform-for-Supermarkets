// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const {
  getPendingUsers,
  approveUser,
  rejectUser,
  deactivateUser,
  activateUser,
  getStats,
  getUsers,
  getUsersReport,
  deleteUserPermanently,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// 📊 Stats
router.get("/stats", protect, adminOnly, getStats);

// ⏳ Pending users
router.get("/pending-users", protect, adminOnly, getPendingUsers);

// ✅ Approve / ❌ Reject
router.patch("/approve/:userId", protect, adminOnly, approveUser);
router.patch("/reject/:userId", protect, adminOnly, rejectUser);

// 👥 Users
router.get("/users", protect, adminOnly, getUsers);

// 🚫 Deactivate / Activate
router.put("/users/:id/deactivate", protect, adminOnly, deactivateUser);
router.put("/users/:id/activate", protect, adminOnly, activateUser);

// 🗑️ DELETE SUPPLIER (same logic)
router.delete("/supplier/:id", protect, adminOnly, deleteUserPermanently);

// 🗑️ PERMANENT DELETE
router.delete("/users/:id/permanent", protect, adminOnly, deleteUserPermanently);

// 📄 CSV
router.get("/users-report", protect, adminOnly, getUsersReport);

module.exports = router;
