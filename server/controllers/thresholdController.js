const Threshold = require("../models/Threshold")

// Get global thresholds
exports.getGlobalThresholds = async (req, res) => {
  try {
    let thresholds = await Threshold.findOne({ patientId: "global" })

    if (!thresholds) {
      // Create default global thresholds if they don't exist
      thresholds = new Threshold({
        patientId: "global",
        heartRate: {
          warning: { min: 55, max: 110 },
          critical: { min: 45, max: 130 },
        },
        spO2: {
          warning: { min: 92, max: 100 },
          critical: { min: 88, max: 100 },
        },
        bloodPressure: {
          warning: { systolic: 150, diastolic: 95 },
          critical: { systolic: 180, diastolic: 110 },
        },
        temperature: {
          warning: { min: 35.5, max: 38.0 },
          critical: { min: 34.0, max: 39.5 },
        },
        ivBagLevel: {
          warning: 30,
          critical: 15,
        },
      })
      await thresholds.save()
    }

    res.json({
      success: true,
      data: thresholds,
    })
  } catch (error) {
    console.error("Error fetching global thresholds:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching global thresholds",
      error: error.message,
    })
  }
}

// Update global thresholds
exports.updateGlobalThresholds = async (req, res) => {
  try {
    const thresholds = await Threshold.findOneAndUpdate({ patientId: "global" }, req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    })

    res.json({
      success: true,
      data: thresholds,
      message: "Global thresholds updated successfully",
    })
  } catch (error) {
    console.error("Error updating global thresholds:", error)
    res.status(400).json({
      success: false,
      message: "Error updating global thresholds",
      error: error.message,
    })
  }
}

// Get patient-specific thresholds
exports.getPatientThresholds = async (req, res) => {
  try {
    const { serviceNo } = req.params

    const thresholds = await Threshold.findOne({ serviceNo })

    if (!thresholds) {
      return res.status(404).json({
        success: false,
        message: "Patient-specific thresholds not found",
      })
    }

    res.json({
      success: true,
      data: thresholds,
    })
  } catch (error) {
    console.error("Error fetching patient thresholds:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching patient thresholds",
      error: error.message,
    })
  }
}

// Update patient-specific thresholds
exports.updatePatientThresholds = async (req, res) => {
  try {
    const { serviceNo } = req.params
    let updateData = { ...req.body, serviceNo }
    // Validate interval
    const allowedIntervals = [10, 15, 30, 60]
    if (typeof updateData.interval !== 'number' || !allowedIntervals.includes(updateData.interval)) {
      updateData.interval = 30
    }
    const thresholds = await Threshold.findOneAndUpdate(
      { serviceNo },
      updateData,
      { new: true, upsert: true, runValidators: true },
    )
    res.json({
      success: true,
      data: thresholds,
      message: "Patient thresholds updated successfully",
    })
  } catch (error) {
    console.error("Error updating patient thresholds:", error)
    res.status(400).json({
      success: false,
      message: "Error updating patient thresholds",
      error: error.message,
    })
  }
}

// Delete patient-specific thresholds
exports.deletePatientThresholds = async (req, res) => {
  try {
    const { patientId } = req.params

    const result = await Threshold.findOneAndDelete({ patientId })

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Patient thresholds not found",
      })
    }

    res.json({
      success: true,
      message: "Patient thresholds deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting patient thresholds:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting patient thresholds",
      error: error.message,
    })
  }
}
