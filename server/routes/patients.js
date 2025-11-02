const express = require("express")
const router = express.Router()
const patientController = require("../controllers/patientController")

// GET /api/patients - Get all patients
router.get("/", patientController.getAllPatients)

// GET /api/patients/:serviceNo - Get single patient
router.get("/:serviceNo", patientController.getPatient)

// POST /api/patients - Create new patient
router.post("/", patientController.createPatient)

// PUT /api/patients/:serviceNo - Update patient
router.put("/:serviceNo", patientController.updatePatient)

// DELETE /api/patients/:serviceNo - Delete patient
router.delete("/:serviceNo", patientController.deletePatient)

module.exports = router
