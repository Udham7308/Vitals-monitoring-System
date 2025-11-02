const mongoose = require("mongoose")

const thresholdSchema = new mongoose.Schema(
  {
    serviceNo: {
      type: String,
      default: "global",
      index: true,
    },
    heartRate: {
      warning: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      critical: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    spO2: {
      warning: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      critical: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    bloodPressure: {
      warning: {
        systolic: { type: Number, required: true },
        diastolic: { type: Number, required: true },
      },
      critical: {
        systolic: { type: Number, required: true },
        diastolic: { type: Number, required: true },
      },
    },
    temperature: {
      warning: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      critical: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    ivBagLevel: {
      warning: { type: Number, required: true },
      critical: { type: Number, required: true },
    },
    interval: {
      type: Number,
      default: 30,
      min: 10,
      max: 60,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure unique thresholds per patient
thresholdSchema.index({ serviceNo: 1 }, { unique: true })

// Update lastUpdated on save
thresholdSchema.pre("save", function (next) {
  this.lastUpdated = new Date()
  next()
})

module.exports = mongoose.model("Threshold", thresholdSchema)
