const Alert = require("../models/Alert")

// Get alerts for a patient
exports.getPatientAlerts = async (req, res) => {
  try {
    const { serviceNo } = req.params
    const { dismissed = "false", limit = 50 } = req.query

    const filter = { serviceNo }
    if (dismissed !== "all") {
      filter.dismissed = dismissed === "true"
    }

    const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(Number.parseInt(limit))

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching alerts",
      error: error.message,
    })
  }
}

// Create new alert
exports.createAlert = async (req, res) => {
  try {
    const { serviceNo } = req.params
    const alertData = { ...req.body, serviceNo }

    const alert = new Alert(alertData)
    await alert.save()

    res.status(201).json({
      success: true,
      data: alert,
      message: "Alert created successfully",
    })
  } catch (error) {
    console.error("Error creating alert:", error)
    res.status(400).json({
      success: false,
      message: "Error creating alert",
      error: error.message,
    })
  }
}

// Dismiss alert
exports.dismissAlert = async (req, res) => {
  try {
    const { alertId } = req.params

    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        dismissed: true,
        dismissedAt: new Date(),
      },
      { new: true },
    )

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      })
    }

    res.json({
      success: true,
      data: alert,
      message: "Alert dismissed successfully",
    })
  } catch (error) {
    console.error("Error dismissing alert:", error)
    res.status(500).json({
      success: false,
      message: "Error dismissing alert",
      error: error.message,
    })
  }
}
