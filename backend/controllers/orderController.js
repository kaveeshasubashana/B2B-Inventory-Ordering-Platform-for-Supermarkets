const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");

/**
 * 1. Create Order (Supermarket)
 * SUPPORTS MULTIPLE SUPPLIERS
 */
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      deliveryAddress,
      note,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    /**
     * STEP 1: Group items by supplier
     */
    const itemsBySupplier = {};

    for (const item of items) {
      const product = await Product.findById(item.product).populate("supplier");
      if (!product || !product.supplier) {
        return res.status(400).json({ message: "Invalid product or supplier" });
      }

      const supplierId = product.supplier._id.toString();

      if (!itemsBySupplier[supplierId]) {
        itemsBySupplier[supplierId] = [];
      }

      itemsBySupplier[supplierId].push({
        product: item.product,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });
    }

    /**
     * STEP 2: Create one order per supplier
     */
    const createdOrders = [];

    for (const supplierId of Object.keys(itemsBySupplier)) {
      const supplierItems = itemsBySupplier[supplierId];

      const supplierTotal = supplierItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      const order = new Order({
        supermarket: req.user.id,
        supplier: supplierId, // ✅ REQUIRED FIELD
        items: supplierItems,
        totalAmount: supplierTotal,
        deliveryAddress,
        note,
        paymentMethod: paymentMethod || "Cash",
        paymentStatus:
          paymentMethod === "Card" ? "Paid" : "Pending",
        status: "Pending",
        district: req.user.district,
      });

      const savedOrder = await order.save();
      createdOrders.push(savedOrder);
    }

    return res.status(201).json({
      message: "Orders created successfully",
      orders: createdOrders,
    });
  } catch (error) {
    console.error("Order Create Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * 2. Get My Orders (Supermarket)
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ supermarket: req.user.id })
      .populate("supplier", "name email district")
      .populate("items.product", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 3. Get Supplier Orders
 */
const getSupplierOrders = async (req, res) => {
  try {
    const query = { supplier: req.user.id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .populate("supermarket", "name email district")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 4. Get Order By ID
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id)
      .populate("supermarket", "name email district address")
      .populate("supplier", "name email district")
      .populate("items.product", "name price image");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      req.user.role === "supplier" &&
      order.supplier.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "supermarket" &&
      order.supermarket.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * 5. Update Order Status (Supplier)
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = [
      "Pending",
      "Accepted",
      "Dispatched",
      "Delivered",
      "Rejected",
    ];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔒 Supplier-only permission
    if (order.supplier.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 🔁 Status flow control
    const flow = {
      Pending: ["Accepted", "Rejected"],
      Accepted: ["Dispatched"],
      Dispatched: ["Delivered"],
      Delivered: [],
      Rejected: [],
    };

    if (!flow[order.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${order.status} to ${status}`,
      });
    }

    // ✅ UPDATE STATUS
    order.status = status;

    // ✅ IMPORTANT FIX: Mark payment as PAID when Delivered
    if (status === "Delivered") {
      order.paymentStatus = "Paid";
    }

    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ message: error.message });
  }
};



/**
 * 6. Delete Order (Supermarket - Order History)
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order id" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔐 Only the supermarket who placed the order can delete it
    if (order.supermarket.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this order" });
    }

    await order.deleteOne();

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getSupplierOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder, 
};
