import type { VitalThresholds } from "./types"

export function getDefaultThresholds(): VitalThresholds {
  return {
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
  }
}

export function getVitalStatusWithThresholds(
  vitalType: string,
  value: number | { systolic: number; diastolic: number },
  thresholds: VitalThresholds,
): "normal" | "warning" | "critical" {
  switch (vitalType) {
    case "heartRate":
      const hr = value as number
      // Critical: outside critical bounds (more restrictive)
      if (hr <= thresholds.heartRate.critical.min || hr >= thresholds.heartRate.critical.max) return "critical"
      // Warning: outside warning bounds but within critical bounds (less restrictive)
      if (hr <= thresholds.heartRate.warning.min || hr >= thresholds.heartRate.warning.max) return "warning"
      // Normal: within warning bounds
      return "normal"

    case "spO2":
      const spo2 = value as number
      // Critical: below critical minimum (88%)
      if (spo2 <= thresholds.spO2.critical.min) return "critical"
      // Warning: below warning minimum but above critical (92%)
      if (spo2 <= thresholds.spO2.warning.min) return "warning"
      // Normal: above warning minimum
      return "normal"

    case "bloodPressure":
      const bp = value as { systolic: number; diastolic: number }
      // Critical: above critical thresholds
      if (
        bp.systolic >= thresholds.bloodPressure.critical.systolic ||
        bp.diastolic >= thresholds.bloodPressure.critical.diastolic
      )
        return "critical"
      // Warning: above warning thresholds but below critical
      if (
        bp.systolic >= thresholds.bloodPressure.warning.systolic ||
        bp.diastolic >= thresholds.bloodPressure.warning.diastolic
      )
        return "warning"
      // Normal: below warning thresholds
      return "normal"

    case "temperature":
      const temp = value as number
      // Critical: outside critical bounds (34-39.5°C)
      if (temp <= thresholds.temperature.critical.min || temp >= thresholds.temperature.critical.max) return "critical"
      // Warning: outside warning bounds but within critical bounds (35.5-38°C)
      if (temp <= thresholds.temperature.warning.min || temp >= thresholds.temperature.warning.max) return "warning"
      // Normal: within warning bounds
      return "normal"

    case "ivBagLevel":
      const iv = value as number
      // Critical: at or below critical threshold (15%)
      if (iv <= thresholds.ivBagLevel.critical) return "critical"
      // Warning: at or below warning threshold but above critical (30%)
      if (iv <= thresholds.ivBagLevel.warning) return "warning"
      // Normal: above warning threshold
      return "normal"

    default:
      return "normal"
  }
}

export function checkCriticalAlertsWithThresholds(patient: any, thresholds: VitalThresholds): boolean {
  return (
    patient.alerts.some((alert: any) => alert.severity === "critical") ||
    getVitalStatusWithThresholds("heartRate", patient.heartRate, thresholds) === "critical" ||
    getVitalStatusWithThresholds("spO2", patient.spO2, thresholds) === "critical" ||
    getVitalStatusWithThresholds("bloodPressure", patient.bloodPressure, thresholds) === "critical" ||
    getVitalStatusWithThresholds("temperature", patient.temperature, thresholds) === "critical" ||
    getVitalStatusWithThresholds("ivBagLevel", patient.ivBagLevel, thresholds) === "critical"
  )
}

export function generateAlertsWithThresholds(
  patientData: any,
  thresholds: VitalThresholds,
  existingAlerts: any[],
): any[] {
  const alerts = [...existingAlerts]
  const now = new Date().toISOString()

  // Check each vital against thresholds
  const vitals = [
    {
      type: "heartRate",
      value: patientData.heartRate,
      name: "Heart Rate",
      unit: "bpm",
    },
    {
      type: "spO2",
      value: patientData.spO2,
      name: "SpO₂",
      unit: "%",
    },
    {
      type: "bloodPressure",
      value: patientData.bloodPressure,
      name: "Blood Pressure",
      unit: "mmHg",
    },
    {
      type: "temperature",
      value: patientData.temperature,
      name: "Temperature",
      unit: "°C",
    },
    {
      type: "ivBagLevel",
      value: patientData.ivBagLevel,
      name: "IV Bag Level",
      unit: "%",
    },
  ]

  vitals.forEach((vital) => {
    const status = getVitalStatusWithThresholds(vital.type, vital.value, thresholds)

    if (status === "critical" || status === "warning") {
      // Check if we already have a recent alert for this vital
      const recentAlert = alerts.find(
        (alert) =>
          alert.message.includes(vital.name) &&
          alert.severity === status &&
          Date.now() - new Date(alert.timestamp).getTime() < 300000, // 5 minutes
      )

      if (!recentAlert) {
        let message = ""
        if (vital.type === "bloodPressure") {
          const bp = vital.value as { systolic: number; diastolic: number }
          message = `${vital.name} ${status === "critical" ? "Critical" : "Warning"}: ${bp.systolic}/${bp.diastolic} ${vital.unit}`
        } else {
          message = `${vital.name} ${status === "critical" ? "Critical" : "Warning"}: ${vital.value}${vital.unit}`
        }

        alerts.unshift({
          type: status === "critical" ? "Critical" : "Warning",
          message,
          timestamp: now,
          severity: status,
        })
      }
    }
  })

  return alerts.slice(0, 10) // Keep only last 10 alerts
}
