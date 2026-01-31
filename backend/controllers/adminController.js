// backend/controllers/adminController.js
const User = require("../models/User");
const Product = require("../models/Product");

/* =========================
   GET PENDING USERS
========================= */
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ isApproved: false }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load pending users" });
  }
};

/* =========================
   APPROVE USER
========================= */
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isApproved = true;
    user.isActive = true;
    await user.save();

    res.json({ message: "User approved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve user" });
  }
};

/* =========================
   REJECT USER (DELETE)
========================= */
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User rejected and removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject user" });
  }
};

/* =========================
   DEACTIVATE USER
========================= */
const deactivateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "User deactivated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to deactivate user" });
  }
};

/* =========================
   ACTIVATE USER
========================= */
const activateUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: true });
    res.json({ message: "User activated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to activate user" });
  }
};

/* =========================
   DELETE USER PERMANENTLY
========================= */
const deleteUserPermanently = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "supplier") {
      // 🔥 REMOVE ALL PRODUCTS OF SUPPLIER
      await Product.deleteMany({ supplier: user._id });
    }

    await user.deleteOne();
    res.json({ message: "User permanently deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

/* =========================
   DASHBOARD STATS
========================= */
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSuppliers = await User.countDocuments({ role: "supplier" });
    const totalSupermarkets = await User.countDocuments({ role: "supermarket" });
    const pendingUsers = await User.countDocuments({ isApproved: false });
    const approvedUsers = await User.countDocuments({ isApproved: true });

    res.json({
      totalUsers,
      totalSuppliers,
      totalSupermarkets,
      pendingUsers,
      approvedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load stats" });
  }
};

/* =========================
   GET USERS
========================= */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to load users" });
  }
};

/* =========================
   USERS CSV REPORT ✅ FIXED
========================= */
const getUsersReport = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    let csv = "Name,Email,Role,Approved,Active\n";
    users.forEach(u => {
      csv += `${u.name},${u.email},${u.role},${u.isApproved},${u.isActive}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment("users-report.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Failed to generate report" });
  }
};

/* =========================
   EXPORTS ✅ VERY IMPORTANT
========================= */
module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  deactivateUser,
  activateUser,
  deleteUserPermanently,
  getStats,
  getUsers,
  getUsersReport, // ✅ MUST EXIST
};
