const mongoose = require("mongoose")

const patientSchema = new mongoose.Schema(
  {
    serviceNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bedNo: {
      type: String,
      trim: true,
      unique: true, // Ensure bed number is unique
    },
    service: {
      type: String,
      trim: true,
    },
    rank: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
    },
    contactNo: {
      type: String,
      trim: true,
    },
    nextOfKin: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["stable", "warning", "critical"],
      default: "stable",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Update lastUpdated on save
patientSchema.pre("save", function (next) {
  this.lastUpdated = new Date()
  next()
})

// Index for efficient queries
patientSchema.index({ serviceNo: 1 })
patientSchema.index({ status: 1 })
patientSchema.index({ isActive: 1 })
// Add unique index for bedNo
patientSchema.index({ bedNo: 1 }, { unique: true })

module.exports = mongoose.model("Patient", patientSchema)
