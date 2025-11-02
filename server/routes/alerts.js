const express = require("express")
const router = express.Router()
const alertController = require("../controllers/alertController")

// GET /api/alerts/:serviceNo - Get patient alerts
router.get("/:serviceNo", alertController.getPatientAlerts)

// POST /api/alerts/:serviceNo - Create alert
router.post("/:serviceNo", alertController.createAlert)

// PUT /api/alerts/:alertId/dismiss - Dismiss alert
router.put("/:alertId/dismiss", alertController.dismissAlert)

module.exports = router
