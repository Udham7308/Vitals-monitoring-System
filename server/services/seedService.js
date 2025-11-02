const Patient = require("../models/Patient")
const Vitals = require("../models/Vitals")
const Threshold = require("../models/Threshold")

class SeedService {
  async initializeData() {
    try {
      // Check if data already exists
      const existingPatients = await Patient.countDocuments()
      if (existingPatients > 0) {
        console.log("✅ Database already has data, skipping seed")
        return
      }

      console.log("🌱 Seeding initial data...")

      // Create default global thresholds
      await this.createDefaultThresholds()

      // Create initial patients
      await this.createInitialPatients()

      console.log("✅ Initial data seeded successfully")
    } catch (error) {
      console.error("❌ Error seeding data:", error)
    }
  }

  async createDefaultThresholds() {
    const defaultThresholds = new Threshold({
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

    await defaultThresholds.save()
    console.log("📊 Default thresholds created")
  }

  async createInitialPatients() {
    const initialPatients = [
      {
        serviceNo: "12345678",
        name: "Sgt. Johnson",
        bedNo: "A-101",
        service: "Army",
        rank: "Sergeant (Sgt)",
        unit: "1st Infantry Division",
        contactNo: "+1-555-123-4567",
        nextOfKin: "Mary Johnson (Wife) - +1-555-987-6543",
        status: "stable",
      },
      {
        serviceNo: "87654321",
        name: "Cpl. Martinez",
        bedNo: "B-205",
        service: "Navy",
        rank: "Corporal (Cpl)",
        unit: "2nd Armored Division",
        contactNo: "+1-555-234-5678",
        nextOfKin: "Carlos Martinez (Father) - +1-555-876-5432",
        status: "warning",
      },
      {
        serviceNo: "11223344",
        name: "Lt. Thompson",
        bedNo: "C-301",
        service: "Air Force",
        rank: "First Lieutenant (1LT)",
        unit: "3rd Medical Battalion",
        contactNo: "+1-555-345-6789",
        nextOfKin: "Sarah Thompson (Mother) - +1-555-765-4321",
        status: "stable",
      },
      {
        serviceNo: "44332211",
        name: "Pvt. Wilson",
        bedNo: "A-102",
        service: "Army",
        rank: "Private (Pvt)",
        unit: "4th Support Company",
        contactNo: "+1-555-456-7890",
        nextOfKin: "James Wilson (Brother) - +1-555-654-3210",
        status: "critical",
      },
    ]

    for (const patientData of initialPatients) {
      const patient = new Patient(patientData)
      await patient.save()

      // Create initial vitals for each patient
      const initialVitals = new Vitals({
        serviceNo: patient.serviceNo,
        heartRate: 75 + Math.floor(Math.random() * 20) - 10,
        spO2: 98 + Math.floor(Math.random() * 3) - 1,
        bloodPressure: {
          systolic: 120 + Math.floor(Math.random() * 20) - 10,
          diastolic: 80 + Math.floor(Math.random() * 10) - 5,
        },
        temperature: 36.5 + Math.random() * 1 - 0.5,
        ivBagLevel: 85 + Math.floor(Math.random() * 15),
        source: "manual",
      })
      await initialVitals.save()

      console.log(`👤 Created patient: ${patient.name} (${patient.serviceNo})`)
    }
  }
}

module.exports = new SeedService()
