const express = require("express")
const router = express.Router()
const thresholdController = require("../controllers/thresholdController")

// GET /api/thresholds/global - Get global thresholds
router.get("/global", thresholdController.getGlobalThresholds)

// PUT /api/thresholds/global - Update global thresholds
router.put("/global", thresholdController.updateGlobalThresholds)

// GET /api/thresholds/:serviceNo - Get patient thresholds
router.get("/:serviceNo", thresholdController.getPatientThresholds)

// PUT /api/thresholds/:serviceNo - Update patient thresholds
router.put("/:serviceNo", thresholdController.updatePatientThresholds)

// DELETE /api/thresholds/:patientId - Delete patient thresholds
router.delete("/:patientId", thresholdController.deletePatientThresholds)

module.exports = router
