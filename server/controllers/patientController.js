const Patient = require("../models/Patient")
const Vitals = require("../models/Vitals")
const Alert = require("../models/Alert")
const Threshold = require("../models/Threshold")

// Get all patients with current vitals and alerts
exports.getAllPatients = async (req, res) => {
  try {
    const { status, active = "true" } = req.query

    const filter = { isActive: active === "true" }
    if (status) filter.status = status

    const patients = await Patient.find(filter).sort({ lastUpdated: -1 })

    // Get current vitals and recent alerts for each patient
    const patientsWithData = await Promise.all(
      patients.map(async (patient) => {
        const [currentVitals, recentAlerts] = await Promise.all([
          Vitals.findOne({ serviceNo: patient.serviceNo }).sort({ timestamp: -1 }),
          Alert.find({
            serviceNo: patient.serviceNo,
            dismissed: false,
          })
            .sort({ timestamp: -1 })
            .limit(10),
        ])

        return {
          serviceNo: patient.serviceNo,
          name: patient.name,
          bedNo: patient.bedNo,
          service: patient.service,
          rank: patient.rank,
          unit: patient.unit,
          contactNo: patient.contactNo,
          nextOfKin: patient.nextOfKin,
          status: patient.status,
          heartRate: currentVitals?.heartRate || 75,
          spO2: currentVitals?.spO2 || 98,
          bloodPressure: currentVitals?.bloodPressure || { systolic: 120, diastolic: 80 },
          temperature: currentVitals?.temperature || 36.5,
          ivBagLevel: currentVitals?.ivBagLevel !== undefined ? currentVitals.ivBagLevel : 100,
          alerts: recentAlerts.map((alert) => ({
            type: alert.type,
            message: alert.message,
            timestamp: alert.timestamp,
            severity: alert.severity,
          })),
        }
      }),
    )

    res.json({
      success: true,
      data: patientsWithData,
      count: patientsWithData.length,
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error.message,
    })
  }
}

// Get single patient
exports.getPatient = async (req, res) => {
  try {
    const { serviceNo } = req.params

    const patient = await Patient.findOne({ serviceNo, isActive: true })
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    // Get current vitals and recent alerts
    const [currentVitals, recentAlerts] = await Promise.all([
      Vitals.findOne({ serviceNo }).sort({ timestamp: -1 }),
      Alert.find({ serviceNo, dismissed: false }).sort({ timestamp: -1 }).limit(10),
    ])

    const patientData = {
      serviceNo: patient.serviceNo,
      name: patient.name,
      bedNo: patient.bedNo,
      service: patient.service,
      rank: patient.rank,
      unit: patient.unit,
      contactNo: patient.contactNo,
      nextOfKin: patient.nextOfKin,
      status: patient.status,
      heartRate: currentVitals?.heartRate || 75,
      spO2: currentVitals?.spO2 || 98,
      bloodPressure: currentVitals?.bloodPressure || { systolic: 120, diastolic: 80 },
      temperature: currentVitals?.temperature || 36.5,
      ivBagLevel: currentVitals?.ivBagLevel || 100,
      alerts: recentAlerts.map((alert) => ({
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp,
        severity: alert.severity,
      })),
    }

    res.json({
      success: true,
      data: patientData,
    })
  } catch (error) {
    console.error("Error fetching patient:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching patient",
      error: error.message,
    })
  }
}

// Create new patient
exports.createPatient = async (req, res) => {
  try {
    const patientData = req.body
    const patient = new Patient(patientData)
    await patient.save()

    // Create initial vitals record
    const initialVitals = new Vitals({
      serviceNo: patient.serviceNo,
      heartRate: 75,
      spO2: 98,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 36.5,
      ivBagLevel: 100,
      source: "manual",
    })
    await initialVitals.save()

    res.status(201).json({
      success: true,
      data: patient,
      message: "Patient created successfully",
    })
  } catch (error) {
    if (error.code === 11000) {
      let message = "Duplicate key error"
      if (error.keyPattern && error.keyPattern.bedNo) {
        message = "Bed number already exists"
      } else if (error.keyPattern && error.keyPattern.serviceNo) {
        message = "Service Number already exists"
      }
      return res.status(400).json({
        success: false,
        message,
      })
    }

    console.error("Error creating patient:", error)
    res.status(400).json({
      success: false,
      message: "Error creating patient",
      error: error.message,
    })
  }
}

// Update patient
exports.updatePatient = async (req, res) => {
  try {
    const { serviceNo } = req.params
    const updateData = req.body

    const patient = await Patient.findOneAndUpdate({ serviceNo, isActive: true }, updateData, {
      new: true,
      runValidators: true,
    })

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    res.json({
      success: true,
      data: patient,
      message: "Patient updated successfully",
    })
  } catch (error) {
    console.error("Error updating patient:", error)
    res.status(400).json({
      success: false,
      message: "Error updating patient",
      error: error.message,
    })
  }
}

// Delete patient (hard delete: remove patient, vitals, alerts, thresholds)
exports.deletePatient = async (req, res) => {
  try {
    const { serviceNo } = req.params

    // Delete patient
    const patient = await Patient.findOneAndDelete({ serviceNo })
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      })
    }

    // Delete all related vitals, alerts, and thresholds
    await Promise.all([
      Vitals.deleteMany({ serviceNo }),
      Alert.deleteMany({ serviceNo }),
      Threshold.deleteMany({ serviceNo }),
    ])

    res.json({
      success: true,
      message: "Patient and all related data deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting patient:", error)
    res.status(500).json({
      success: false,
      message: "Error deleting patient",
      error: error.message,
    })
  }
}
