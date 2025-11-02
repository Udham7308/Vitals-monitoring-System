const mongoose = require("mongoose")

const vitalsSchema = new mongoose.Schema(
  {
    serviceNo: {
      type: String,
      required: true,
      ref: "Patient",
    },
    heartRate: {
      type: Number,
      required: true,
      min: 0,
      max: 300,
    },
    spO2: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    bloodPressure: {
      systolic: {
        type: Number,
        required: true,
        min: 0,
        max: 300,
      },
      diastolic: {
        type: Number,
        required: true,
        min: 0,
        max: 200,
      },
    },
    temperature: {
      type: Number,
      required: true,
      min: 30,
      max: 45,
    },
    ivBagLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    source: {
      type: String,
      enum: ["sensor", "manual", "mock"],
      default: "mock",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index for efficient patient queries
vitalsSchema.index({ serviceNo: 1, timestamp: -1 })
vitalsSchema.index({ timestamp: -1 })

module.exports = mongoose.model("Vitals", vitalsSchema)
