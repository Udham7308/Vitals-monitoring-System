const Patient = require("../models/Patient")
const Vitals = require("../models/Vitals")
const Alert = require("../models/Alert")
const Threshold = require("../models/Threshold")

class MockDataService {
  constructor() {
    this.intervals = new Map()
    this.isRunning = false
    this.seedCounter = 0
  }

  // Seeded random function for consistent variations
  seededRandom(seed) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  // Generate realistic vital variations
  generateVitalVariation(baseValue, range, seed) {
    return baseValue + (this.seededRandom(seed) - 0.5) * range
  }

  // Check vital status against thresholds
  checkVitalStatus(vitalType, value, thresholds) {
    switch (vitalType) {
      case "heartRate":
        // Critical: outside critical bounds (more restrictive)
        if (value <= thresholds.heartRate.critical.min || value >= thresholds.heartRate.critical.max) return "critical"
        // Warning: outside warning bounds but within critical bounds (less restrictive)
        if (value <= thresholds.heartRate.warning.min || value >= thresholds.heartRate.warning.max) return "warning"
        return "normal"

      case "spO2":
        // Critical: at or below critical minimum (88%)
        if (value <= thresholds.spO2.critical.min) return "critical"
        // Warning: at or below warning minimum but above critical (92%)
        if (value <= thresholds.spO2.warning.min) return "warning"
        return "normal"

      case "bloodPressure":
        // Critical: at or above critical thresholds
        if (
          value.systolic >= thresholds.bloodPressure.critical.systolic ||
          value.diastolic >= thresholds.bloodPressure.critical.diastolic
        )
          return "critical"
        // Warning: at or above warning thresholds but below critical
        if (
          value.systolic >= thresholds.bloodPressure.warning.systolic ||
          value.diastolic >= thresholds.bloodPressure.warning.diastolic
        )
          return "warning"
        return "normal"

      case "temperature":
        // Critical: outside critical bounds (34-39.5°C)
        if (value <= thresholds.temperature.critical.min || value >= thresholds.temperature.critical.max)
          return "critical"
        // Warning: outside warning bounds but within critical bounds (35.5-38°C)
        if (value <= thresholds.temperature.warning.min || value >= thresholds.temperature.warning.max) return "warning"
        return "normal"

      case "ivBagLevel":
        // Critical: at or below critical threshold (15%)
        if (value <= thresholds.ivBagLevel.critical) return "critical"
        // Warning: at or below warning threshold but above critical (30%)
        if (value <= thresholds.ivBagLevel.warning) return "warning"
        return "normal"

      default:
        return "normal"
    }
  }

  // Generate alerts based on vital status
  async generateAlert(serviceNo, vitalType, value, status, thresholds) {
    if (status === "normal") return

    // Check if similar alert exists in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const existingAlert = await Alert.findOne({
      serviceNo,
      message: { $regex: this.getVitalName(vitalType), $options: "i" },
      severity: status,
      timestamp: { $gte: fiveMinutesAgo },
      dismissed: false,
    })

    if (existingAlert) return // Don't create duplicate alerts

    let message = ""
    switch (vitalType) {
      case "heartRate":
        message = `${status === "critical" ? "Critical" : "Warning"} Heart Rate: ${value} bpm`
        break
      case "spO2":
        message = `${status === "critical" ? "Critical" : "Warning"} SpO₂: ${value}%`
        break
      case "bloodPressure":
        message = `${status === "critical" ? "Critical" : "Warning"} Blood Pressure: ${value.systolic}/${value.diastolic} mmHg`
        break
      case "temperature":
        message = `${status === "critical" ? "Critical" : "Warning"} Temperature: ${value}°C`
        break
      case "ivBagLevel":
        message = `${status === "critical" ? "Critical" : "Warning"} IV Bag Level: ${value}%`
        break
    }

    const alert = new Alert({
      serviceNo,
      type: status === "critical" ? "Critical" : "Warning",
      message,
      severity: status,
      timestamp: new Date(),
    })

    await alert.save()
    console.log(`🚨 Alert generated for ${serviceNo}: ${message}`)
  }

  getVitalName(vitalType) {
    const names = {
      heartRate: "Heart Rate",
      spO2: "SpO₂",
      bloodPressure: "Blood Pressure",
      temperature: "Temperature",
      ivBagLevel: "IV Bag",
    }
    return names[vitalType] || vitalType
  }

  // Generate mock vitals for a patient
  async generateMockVitals(patient) {
    try {
      // Get patient-specific or global thresholds
      let thresholds = await Threshold.findOne({ serviceNo: patient.serviceNo })
      if (!thresholds) {
        thresholds = await Threshold.findOne({ serviceNo: "global" })
      }

      if (!thresholds) {
        console.log(`No thresholds found for ${patient.serviceNo}, skipping mock data generation`)
        return
      }

      // Get last vitals for baseline
      const lastVitals = await Vitals.findOne({ serviceNo: patient.serviceNo }).sort({ timestamp: -1 })

      // Base values (use last vitals or defaults)
      const baseValues = lastVitals
        ? {
            heartRate: lastVitals.heartRate,
            spO2: lastVitals.spO2,
            bloodPressure: lastVitals.bloodPressure,
            temperature: lastVitals.temperature,
            ivBagLevel: Math.max(0, lastVitals.ivBagLevel - (Math.random() * 2 + 0.5)), // Decrease by 0.5-2.5% each time
          }
        : {
            heartRate: 75,
            spO2: 98,
            bloodPressure: { systolic: 120, diastolic: 80 },
            temperature: 36.7,
            ivBagLevel: 85,
          }

      // Generate seed based on patient and time
      const seed = patient.serviceNo.charCodeAt(0) + this.seedCounter
      this.seedCounter = (this.seedCounter + 1) % 1000

      // Generate new vitals with realistic variations
      const newVitals = {
        serviceNo: patient.serviceNo,
        heartRate: Math.max(30, Math.min(200, Math.round(this.generateVitalVariation(baseValues.heartRate, 10, seed)))),
        spO2: Math.max(70, Math.min(100, Math.round(this.generateVitalVariation(baseValues.spO2, 3, seed + 1)))),
        bloodPressure: {
          systolic: Math.max(
            70,
            Math.min(250, Math.round(this.generateVitalVariation(baseValues.bloodPressure.systolic, 15, seed + 2))),
          ),
          diastolic: Math.max(
            40,
            Math.min(150, Math.round(this.generateVitalVariation(baseValues.bloodPressure.diastolic, 10, seed + 3))),
          ),
        },
        temperature: Math.max(
          32,
          Math.min(42, Math.round(this.generateVitalVariation(baseValues.temperature, 1, seed + 4) * 10) / 10),
        ),
        ivBagLevel: Math.max(0, Math.round(baseValues.ivBagLevel * 10) / 10), // Keep one decimal place
        source: "mock",
        timestamp: new Date(),
      }

      // Save vitals
      const vitals = new Vitals(newVitals)
      await vitals.save()

      // Check each vital and generate alerts if needed
      const vitalChecks = [
        { type: "heartRate", value: newVitals.heartRate },
        { type: "spO2", value: newVitals.spO2 },
        { type: "bloodPressure", value: newVitals.bloodPressure },
        { type: "temperature", value: newVitals.temperature },
        { type: "ivBagLevel", value: newVitals.ivBagLevel },
      ]

      for (const vital of vitalChecks) {
        const status = this.checkVitalStatus(vital.type, vital.value, thresholds)
        if (status !== "normal") {
          await this.generateAlert(patient.serviceNo, vital.type, vital.value, status, thresholds)
        }
      }

      console.log(`📊 Generated mock vitals for ${patient.name} (${patient.serviceNo}) - IV: ${newVitals.ivBagLevel}%`)
    } catch (error) {
      console.error(`Error generating mock vitals for ${patient.serviceNo}:`, error)
    }
  }

  // Start mock data generation for all active patients
  async startMockDataGeneration() {
    if (this.isRunning) return

    this.isRunning = true
    console.log("🎭 Starting mock data generation (per-patient intervals)...")

    // Clear any existing intervals
    this.stopMockDataGeneration()

    // For each active patient, set up a timer based on their interval
    const setupPatientIntervals = async () => {
      const activePatients = await Patient.find({ isActive: true })
      for (const patient of activePatients) {
        // Fetch interval from thresholds (default 30 min)
        let thresholds = await Threshold.findOne({ serviceNo: patient.serviceNo })
        if (!thresholds) {
          thresholds = await Threshold.findOne({ serviceNo: "global" })
        }
        const intervalMinutes = thresholds?.interval || 30
        const intervalMs = intervalMinutes * 60 * 1000
        // If already has a timer, clear it
        if (this.intervals.has(patient.serviceNo)) {
          clearInterval(this.intervals.get(patient.serviceNo))
        }
        // Set up new timer
        const timer = setInterval(async () => {
          await this.generateMockVitals(patient)
        }, intervalMs)
        this.intervals.set(patient.serviceNo, timer)
        // Immediately generate once on startup
        await this.generateMockVitals(patient)
      }
    }
    await setupPatientIntervals()
    console.log("✅ Mock data generation started - per-patient intervals")
  }

  // Stop mock data generation
  stopMockDataGeneration() {
    if (!this.isRunning) return
    this.intervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.intervals.clear()
    this.isRunning = false
    console.log("🛑 Mock data generation stopped")
  }
}

module.exports = new MockDataService()
