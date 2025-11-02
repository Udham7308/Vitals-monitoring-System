import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Patient } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getVitalStatus(
  vitalType: string,
  value: number | { systolic: number; diastolic: number },
): "normal" | "warning" | "critical" {
  switch (vitalType) {
    case "heartRate":
      const hr = value as number
      if (hr < 50 || hr > 120) return "critical"
      if (hr < 60 || hr > 100) return "warning"
      return "normal"

    case "spO2":
      const spo2 = value as number
      if (spo2 < 90) return "critical"
      if (spo2 < 95) return "warning"
      return "normal"

    case "bloodPressure":
      const bp = value as { systolic: number; diastolic: number }
      if (bp.systolic > 180 || bp.diastolic > 110) return "critical"
      if (bp.systolic > 140 || bp.diastolic > 90) return "warning"
      return "normal"

    case "temperature":
      const temp = value as number
      if (temp < 35 || temp > 39) return "critical"
      if (temp < 36 || temp > 37.5) return "warning"
      return "normal"

    case "ivBagLevel":
      const iv = value as number
      if (iv <= 10) return "critical"
      if (iv <= 25) return "warning"
      return "normal"

    default:
      return "normal"
  }
}

export function checkCriticalAlerts(patient: Patient): boolean {
  return (
    patient.alerts.some((alert) => alert.severity === "critical") ||
    getVitalStatus("heartRate", patient.heartRate) === "critical" ||
    getVitalStatus("spO2", patient.spO2) === "critical" ||
    getVitalStatus("bloodPressure", patient.bloodPressure) === "critical" ||
    getVitalStatus("temperature", patient.temperature) === "critical" ||
    getVitalStatus("ivBagLevel", patient.ivBagLevel) === "critical"
  )
}
