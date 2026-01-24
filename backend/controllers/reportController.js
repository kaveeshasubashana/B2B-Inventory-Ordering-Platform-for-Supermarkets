const mongoose = require("mongoose");
const Order = require("../models/Order");

// Helper: date range from query
function getDateRange(req) {
  const { startDate, endDate } = req.query;

  const match = {};
  if (startDate) match.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    match.$lte = end;
  }

  return Object.keys(match).length ? { createdAt: match } : {};
}

// Helper: optional status filter
function getStatusMatch(req) {
  const { status } = req.query;
  if (!status || status === "All") return {};
  return { status };
}

/**
 * GET /api/reports/supplier/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&status=All|Pending|Confirmed|Delivered|Cancelled
 * Returns: totalOrders, totalRevenue, deliveredOrders, pendingOrders, cancelledOrders, confirmedOrders
 */
exports.getSupplierReportSummary = async (req, res) => {
  try {
    const supplierId = req.user.id;

    const dateMatch = getDateRange(req);
    const statusMatch = getStatusMatch(req);

    const pipeline = [
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          ...dateMatch,
          ...statusMatch,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalRevenue: 1,
          pendingOrders: 1,
          confirmedOrders: 1,
          deliveredOrders: 1,
          cancelledOrders: 1,
        },
      },
    ];

    const [result] = await Order.aggregate(pipeline);

    res.json(
      result || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to load summary", error: err.message });
  }
};

/**
 * GET /api/reports/supplier/revenue-over-time?granularity=month|day&startDate&endDate&status
 * Returns: [{ label, revenue, orders }]
 */
exports.getSupplierRevenueOverTime = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const granularity = req.query.granularity === "day" ? "day" : "month";

    const dateMatch = getDateRange(req);
    const statusMatch = getStatusMatch(req);

    const groupId =
      granularity === "day"
        ? { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, d: { $dayOfMonth: "$createdAt" } }
        : { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } };

    const pipeline = [
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          ...dateMatch,
          ...statusMatch,
        },
      },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      {
        $project: {
          _id: 0,
          label:
            granularity === "day"
              ? {
                  $concat: [
                    { $toString: "$_id.y" },
                    "-",
                    { $toString: "$_id.m" },
                    "-",
                    { $toString: "$_id.d" },
                  ],
                }
              : {
                  $concat: [
                    { $toString: "$_id.y" },
                    "-",
                    { $toString: "$_id.m" },
                  ],
                },
          revenue: 1,
          orders: 1,
        },
      },
    ];

    const data = await Order.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load revenue trend", error: err.message });
  }
};

/**
 * GET /api/reports/supplier/orders-by-status?startDate&endDate
 * Returns: [{ status, count }]
 */
exports.getSupplierOrdersByStatus = async (req, res) => {
  try {
    const supplierId = req.user.id;

    const dateMatch = getDateRange(req);

    const pipeline = [
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          ...dateMatch,
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } },
      { $sort: { status: 1 } },
    ];

    const data = await Order.aggregate(pipeline);

    // Ensure all statuses exist even if 0
    const all = ["Pending", "Confirmed", "Delivered", "Cancelled"];
    const map = new Map(data.map((d) => [d.status, d.count]));
    const normalized = all.map((s) => ({ status: s, count: map.get(s) || 0 }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: "Failed to load status breakdown", error: err.message });
  }
};

/**
 * GET /api/reports/supplier/top-buyers?limit=10&district=All Districts&search=...
 * Returns: [{ buyerId, buyerName, district, orders, revenue, lastOrderDate, email }]
 */
exports.getSupplierTopBuyers = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const district = req.query.district;
    const search = (req.query.search || "").trim().toLowerCase();

    const dateMatch = getDateRange(req);
    const statusMatch = getStatusMatch(req);

    const pipeline = [
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          ...dateMatch,
          ...statusMatch,
        },
      },
      {
        $group: {
          _id: "$supermarket",
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $project: {
          _id: 0,
          buyerId: "$buyer._id",
          buyerName: "$buyer.name",
          email: "$buyer.email",
          district: "$buyer.district",
          orders: 1,
          revenue: 1,
          lastOrderDate: 1,
        },
      },
    ];

    // district filter
    if (district && district !== "All Districts") {
      pipeline.push({ $match: { district } });
    }

    // search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { buyerName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { revenue: -1 } });
    pipeline.push({ $limit: limit });

    const data = await Order.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load top buyers", error: err.message });
  }
};

/**
 * GET /api/reports/supplier/top-products?limit=10&search=
 * Requires: Order.items[] has { product, quantity, price } OR at least { product, quantity }
 * Returns: [{ productId, productName, category, qtySold, revenue, stockLeft }]
 */
exports.getSupplierTopProducts = async (req, res) => {
  try {
    const supplierId = req.user.id;
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const search = (req.query.search || "").trim().toLowerCase();

    const dateMatch = getDateRange(req);
    const statusMatch = getStatusMatch(req);

    const pipeline = [
      {
        $match: {
          supplier: new mongoose.Types.ObjectId(supplierId),
          ...dateMatch,
          ...statusMatch,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          qtySold: { $sum: { $ifNull: ["$items.quantity", 0] } },
          revenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.quantity", 0] },
                { $ifNull: ["$items.price", 0] }, // if price missing, revenue will be 0
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: { $ifNull: ["$product.name", "Unknown Product"] },
          category: { $ifNull: ["$product.category", "-"] },
          stockLeft: { $ifNull: ["$product.stock", 0] },
          qtySold: 1,
          revenue: 1,
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          productName: { $regex: search, $options: "i" },
        },
      });
    }

    pipeline.push({ $sort: { qtySold: -1 } });
    pipeline.push({ $limit: limit });

    const data = await Order.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to load top products", error: err.message });
  }
};
