// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  approveUser,
  rejectUser,
} = require("../controllers/adminController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

router.get(
  "/pending-users",
  protect,
  authorizeRoles("admin"),
  getPendingUsers
);

router.patch(
  "/approve/:userId",
  protect,
  authorizeRoles("admin"),
  approveUser
);

router.patch(
  "/reject/:userId",
  protect,
  authorizeRoles("admin"),
  rejectUser
);

module.exports = router;
