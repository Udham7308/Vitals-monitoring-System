const mongoose = require("mongoose")

const alertSchema = new mongoose.Schema(
  {
    serviceNo: {
      type: String,
      required: true,
      ref: "Patient",
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["warning", "critical"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Compound indexes for efficient queries
alertSchema.index({ serviceNo: 1, timestamp: -1 })
alertSchema.index({ severity: 1, timestamp: -1 })
alertSchema.index({ dismissed: 1, timestamp: -1 })

module.exports = mongoose.model("Alert", alertSchema)
