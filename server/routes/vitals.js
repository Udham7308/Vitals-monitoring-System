const express = require("express")
const router = express.Router()
const Vitals = require("../models/Vitals")

// GET /api/vitals/:serviceNo - Get latest vitals
router.get("/:serviceNo", async (req, res) => {
  try {
    const { serviceNo } = req.params

    const vitals = await Vitals.findOne({ serviceNo }).sort({ timestamp: -1 })

    if (!vitals) {
      return res.status(404).json({
        success: false,
        message: "No vitals found for this patient",
      })
    }

    res.json({
      success: true,
      data: vitals,
    })
  } catch (error) {
    console.error("Error fetching vitals:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching vitals",
      error: error.message,
    })
  }
})

// GET /api/vitals/:serviceNo/history - Get vitals history
router.get("/:serviceNo/history", async (req, res) => {
  try {
    const { serviceNo } = req.params
    const { limit = 50, hours = 24 } = req.query // Reduced default limit

    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000)

    const vitals = await Vitals.find({
      serviceNo,
      timestamp: { $gte: hoursAgo },
    })
      .sort({ timestamp: -1 })
      .limit(Math.min(Number.parseInt(limit), 50)) // Cap at 50 records max

    res.json({
      success: true,
      data: vitals,
      count: vitals.length,
    })
  } catch (error) {
    console.error("Error fetching vitals history:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching vitals history",
      error: error.message,
    })
  }
})

// POST /api/vitals/:serviceNo - Add new vitals
router.post("/:serviceNo", async (req, res) => {
  try {
    const { serviceNo } = req.params
    const vitalsData = { ...req.body, serviceNo }

    const vitals = new Vitals(vitalsData)
    await vitals.save()

    res.status(201).json({
      success: true,
      data: vitals,
      message: "Vitals recorded successfully",
    })
  } catch (error) {
    console.error("Error recording vitals:", error)
    res.status(400).json({
      success: false,
      message: "Error recording vitals",
      error: error.message,
    })
  }
})

module.exports = router
