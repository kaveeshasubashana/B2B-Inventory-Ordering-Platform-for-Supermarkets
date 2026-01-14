const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    supermarket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },      // snapshot
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },     // unit price
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    note: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "dispatched", "delivered"],
      default: "pending",
    },

    district: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["credit", "cod", "bank"],
      default: "credit",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
