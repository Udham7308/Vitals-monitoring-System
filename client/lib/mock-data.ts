import type { Patient, HistoricalDataPoint } from "./types"

// Use consistent seed for reproducible data
let seedCounter = 0
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export const mockPatients: Patient[] = [
  {
    serviceNo: "12345678",
    name: "Sgt. Johnson",
    heartRate: 75,
    spO2: 98,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 36.7,
    ivBagLevel: 65,
    status: "stable",
    alerts: [
      {
        type: "Warning",
        message: "IV Bag Level Below 70%",
        timestamp: "2024-01-15T14:30:00Z",
        severity: "warning",
      },
    ],
    service: "Army",
    rank: "Sergeant (Sgt)",
    unit: "1st Infantry Division",
    contactNo: "+1-555-123-4567",
    nextOfKin: "Mary Johnson (Wife) - +1-555-987-6543",
    bedNo: "A-101",
    remarks: "Routine monitoring post-surgery",
  },
  {
    serviceNo: "87654321",
    name: "Cpl. Martinez",
    heartRate: 110,
    spO2: 94,
    bloodPressure: { systolic: 140, diastolic: 90 },
    temperature: 38.2,
    ivBagLevel: 15,
    status: "critical",
    alerts: [
      {
        type: "Critical",
        message: "Low IV Bag Level - Immediate Attention Required",
        timestamp: "2024-01-15T14:55:00Z",
        severity: "critical",
      },
      {
        type: "Warning",
        message: "Elevated Heart Rate",
        timestamp: "2024-01-15T14:45:00Z",
        severity: "warning",
      },
    ],
    service: "Navy",
    rank: "Corporal (Cpl)",
    unit: "USS Enterprise",
    contactNo: "+1-555-234-5678",
    nextOfKin: "Carlos Martinez (Brother) - +1-555-876-5432",
    bedNo: "B-205",
    remarks: "Monitor for fever and dehydration",
  },
  {
    serviceNo: "11223344",
    name: "Lt. Thompson",
    heartRate: 68,
    spO2: 99,
    bloodPressure: { systolic: 115, diastolic: 75 },
    temperature: 36.5,
    ivBagLevel: 85,
    status: "stable",
    alerts: [],
    service: "Air Force",
    rank: "Lieutenant (Lt)",
    unit: "15th Fighter Squadron",
    contactNo: "+1-555-345-6789",
    nextOfKin: "Sarah Thompson (Mother) - +1-555-765-4321",
    bedNo: "C-301",
    remarks: "Stable condition, routine check-up",
  },
  {
    serviceNo: "55667788",
    name: "Pvt. Wilson",
    heartRate: 95,
    spO2: 96,
    bloodPressure: { systolic: 130, diastolic: 85 },
    temperature: 37.1,
    ivBagLevel: 45,
    status: "warning",
    alerts: [
      {
        type: "Warning",
        message: "IV Bag Level Below 50%",
        timestamp: "2024-01-15T14:15:00Z",
        severity: "warning",
      },
    ],
    service: "Army",
    rank: "Private (Pvt)",
    unit: "2nd Armored Division",
    contactNo: "+1-555-456-7890",
    nextOfKin: "Robert Wilson (Father) - +1-555-654-3210",
    bedNo: "A-102",
    remarks: "Minor injury recovery",
  },
]

export function generateRealtimeData(patientId: string) {
  // Use patient ID as seed for consistent variations
  const seed = patientId.charCodeAt(patientId.length - 1) + seedCounter
  seedCounter = (seedCounter + 1) % 1000

  const baseData = mockPatients.find((p) => p.serviceNo === patientId)
  if (!baseData) return {}

  const variation = (base: number, range: number, seedOffset: number) =>
    base + (seededRandom(seed + seedOffset) - 0.5) * range

  const newData = {
    heartRate: Math.round(variation(baseData.heartRate, 10, 1)),
    spO2: Math.round(variation(baseData.spO2, 3, 2)),
    bloodPressure: {
      systolic: Math.round(variation(baseData.bloodPressure.systolic, 15, 3)),
      diastolic: Math.round(variation(baseData.bloodPressure.diastolic, 10, 4)),
    },
    temperature: Math.round(variation(baseData.temperature, 1, 5) * 10) / 10,
    ivBagLevel: Math.max(0, Math.round(variation(baseData.ivBagLevel, 5, 6))),
  }

  // Generate new alerts based on thresholds
  const alerts = [...baseData.alerts]
  const now = new Date().toISOString()

  // Check for critical IV bag level
  if (newData.ivBagLevel <= 20 && !alerts.some((a) => a.message.includes("Critical") && a.message.includes("IV"))) {
    alerts.unshift({
      type: "Critical",
      message: "Critical IV Bag Level - Immediate Replacement Required",
      timestamp: now,
      severity: "critical",
    })
  }

  // Check for high heart rate
  if (
    newData.heartRate > 100 &&
    !alerts.some((a) => a.message.includes("Heart Rate") && Date.now() - new Date(a.timestamp).getTime() < 300000)
  ) {
    alerts.unshift({
      type: "Warning",
      message: "Elevated Heart Rate Detected",
      timestamp: now,
      severity: "warning",
    })
  }

  return { ...newData, alerts: alerts.slice(0, 10) }
}

export function generateHistoricalData(patientId: string): HistoricalDataPoint[] {
  const baseData = mockPatients.find((p) => p.serviceNo === patientId)
  if (!baseData) return []

  const data: HistoricalDataPoint[] = []
  // Use fixed base time to avoid hydration issues
  const baseTime = new Date("2024-01-15T12:00:00Z").getTime()

  // Generate 24 hours of data points (every 30 minutes = 48 points)
  for (let i = 47; i >= 0; i--) {
    const time = new Date(baseTime - i * 30 * 60 * 1000)
    const seed = patientId.charCodeAt(0) + i

    data.push({
      time: time.toISOString(),
      heartRate: Math.round(baseData.heartRate + (seededRandom(seed) - 0.5) * 20),
      spO2: Math.round(baseData.spO2 + (seededRandom(seed + 1) - 0.5) * 6),
      temperature: Math.round((baseData.temperature + (seededRandom(seed + 2) - 0.5) * 2) * 10) / 10,
      ivBagLevel: Math.max(0, Math.round(100 - (47 - i) * 2 + (seededRandom(seed + 3) - 0.5) * 10)),
    })
  }

  return data
}
