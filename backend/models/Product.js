// backend/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    category: { type: String, default: "" },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    image: { type: String, default: "" }, // URL or path to uploaded file (e.g. "/uploads/xxx.jpg")
    stock: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true }, // for soft-deletes / deactivation if needed
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
