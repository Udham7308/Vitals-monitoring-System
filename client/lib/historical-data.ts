import type { Patient, VitalThresholds } from "./types"
import { getVitalStatusWithThresholds, getDefaultThresholds } from "./threshold-utils"

export interface HistoricalLog {
  id: string
  serviceNo: string
  patientName: string
  timestamp: string
  vitalType: string
  currentValue: string
  previousValue?: string
  severity: "normal" | "warning" | "critical"
  description: string
  thresholdInfo?: string
  additionalInfo?: string
}

// Use consistent seed for reproducible data
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function generateHistoricalLogs(patient: Patient, thresholds?: VitalThresholds): HistoricalLog[] {
  const logs: HistoricalLog[] = []
  const patientThresholds = thresholds || getDefaultThresholds()
  // Use fixed base time to avoid hydration issues
  const baseTime = new Date("2024-01-15T12:00:00Z").getTime()

  // Generate logs for the last 7 days
  for (let day = 6; day >= 0; day--) {
    // Generate 8 readings per day (every 3 hours)
    for (let reading = 0; reading < 8; reading++) {
      const timestamp = new Date(baseTime - day * 24 * 60 * 60 * 1000 - reading * 3 * 60 * 60 * 1000)
      const seed = patient.serviceNo.charCodeAt(0) + day * 10 + reading

      // Generate realistic variations for each vital
      const baseHR = patient.heartRate + (seededRandom(seed) - 0.5) * 20
      const baseSpO2 = patient.spO2 + (seededRandom(seed + 1) - 0.5) * 6
      const baseSystolic = patient.bloodPressure.systolic + (seededRandom(seed + 2) - 0.5) * 20
      const baseDiastolic = patient.bloodPressure.diastolic + (seededRandom(seed + 3) - 0.5) * 15
      const baseTemp = patient.temperature + (seededRandom(seed + 4) - 0.5) * 2
      const baseIV = Math.max(0, 100 - (6 - day) * 15 + (seededRandom(seed + 5) - 0.5) * 10)

      const vitals = [
        {
          type: "heartRate",
          current: Math.round(baseHR),
          previous: Math.round(baseHR + (seededRandom(seed + 6) - 0.5) * 5),
          unit: "bpm",
          name: "Heart Rate",
        },
        {
          type: "spO2",
          current: Math.round(baseSpO2),
          previous: Math.round(baseSpO2 + (seededRandom(seed + 7) - 0.5) * 2),
          unit: "%",
          name: "SpO₂",
        },
        {
          type: "bloodPressure",
          current: { systolic: Math.round(baseSystolic), diastolic: Math.round(baseDiastolic) },
          previous: {
            systolic: Math.round(baseSystolic + (seededRandom(seed + 8) - 0.5) * 5),
            diastolic: Math.round(baseDiastolic + (seededRandom(seed + 9) - 0.5) * 5),
          },
          unit: "mmHg",
          name: "Blood Pressure",
        },
        {
          type: "temperature",
          current: Math.round(baseTemp * 10) / 10,
          previous: Math.round((baseTemp + (seededRandom(seed + 10) - 0.5) * 0.5) * 10) / 10,
          unit: "°C",
          name: "Temperature",
        },
        {
          type: "ivBagLevel",
          current: Math.round(baseIV),
          previous: Math.round(baseIV + 5),
          unit: "%",
          name: "IV Bag Level",
        },
      ]

      vitals.forEach((vital) => {
        const status = getVitalStatusWithThresholds(vital.type, vital.current, patientThresholds)

        // Only log if there's a status change or it's abnormal (use seeded random for consistency)
        if (status !== "normal" || seededRandom(seed + vital.type.charCodeAt(0)) < 0.3) {
          let currentValueStr = ""
          let previousValueStr = ""
          let thresholdInfo = ""

          if (vital.type === "bloodPressure") {
            const current = vital.current as { systolic: number; diastolic: number }
            const previous = vital.previous as { systolic: number; diastolic: number }
            currentValueStr = `${current.systolic}/${current.diastolic} ${vital.unit}`
            previousValueStr = `${previous.systolic}/${previous.diastolic} ${vital.unit}`
            thresholdInfo = `Warning: >${patientThresholds.bloodPressure.warning.systolic}/${patientThresholds.bloodPressure.warning.diastolic}, Critical: >${patientThresholds.bloodPressure.critical.systolic}/${patientThresholds.bloodPressure.critical.diastolic}`
          } else {
            currentValueStr = `${vital.current} ${vital.unit}`
            previousValueStr = `${vital.previous} ${vital.unit}`

            if (vital.type === "ivBagLevel") {
              thresholdInfo = `Warning: <${patientThresholds.ivBagLevel.warning}%, Critical: <${patientThresholds.ivBagLevel.critical}%`
            } else {
              const thresholdData = patientThresholds[vital.type as keyof VitalThresholds] as any
              if (thresholdData.warning) {
                thresholdInfo = `Warning: ${thresholdData.warning.min}-${thresholdData.warning.max}, Critical: ${thresholdData.critical.min}-${thresholdData.critical.max}`
              }
            }
          }

          const description =
            status === "normal"
              ? `${vital.name} reading recorded: ${currentValueStr}`
              : `${vital.name} ${status} alert: ${currentValueStr}`

          const additionalInfo =
            status !== "normal"
              ? `Patient ${patient.name} requires ${status === "critical" ? "immediate" : "routine"} attention for ${vital.name.toLowerCase()} monitoring.`
              : undefined

          logs.push({
            id: `${patient.serviceNo}-${vital.type}-${timestamp.getTime()}-${reading}`,
            serviceNo: patient.serviceNo,
            patientName: patient.name,
            timestamp: timestamp.toISOString(),
            vitalType: vital.type,
            currentValue: currentValueStr,
            previousValue: previousValueStr,
            severity: status,
            description,
            thresholdInfo,
            additionalInfo,
          })
        }
      })
    }
  }

  // Add some alert-specific logs
  patient.alerts.forEach((alert, index) => {
    logs.push({
      id: `${patient.serviceNo}-alert-${index}`,
      serviceNo: patient.serviceNo,
      patientName: patient.name,
      timestamp: alert.timestamp,
      vitalType: "alert",
      currentValue: alert.severity,
      severity: alert.severity as "warning" | "critical",
      description: `System Alert: ${alert.message}`,
      additionalInfo: `Alert type: ${alert.type}. This alert was automatically generated by the monitoring system.`,
    })
  })

  // Sort by timestamp (newest first)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

export function exportHistoricalData(logs: HistoricalLog[]) {
  const csvContent = [
    // CSV Header
    "Timestamp,Service No,Patient Name,Vital Type,Current Value,Previous Value,Severity,Description,Threshold Info,Additional Info",
    // CSV Data
    ...logs.map((log) =>
      [
        log.timestamp,
        log.serviceNo,
        log.patientName,
        log.vitalType,
        log.currentValue,
        log.previousValue || "",
        log.severity,
        `"${log.description}"`,
        `"${log.thresholdInfo || ""}"`,
        `"${log.additionalInfo || ""}"`,
      ].join(","),
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `patient-historical-data-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
