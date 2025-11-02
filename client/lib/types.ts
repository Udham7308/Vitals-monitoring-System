export interface Patient {
  serviceNo: string
  name: string
  heartRate: number
  spO2: number
  bloodPressure: {
    systolic: number
    diastolic: number
  }
  temperature: number
  ivBagLevel: number
  status: "stable" | "warning" | "critical"
  alerts: Alert[]
  service: "Army" | "Navy" | "Air Force"
  rank?: string
  unit?: string
  contactNo?: string
  nextOfKin?: string
  bedNo?: string
  remarks?: string
}

export interface Alert {
  _id?: string
  type: string
  message: string
  timestamp: string
  severity: "warning" | "critical"
}

export interface HistoricalDataPoint {
  time: string
  heartRate: number
  spO2: number
  temperature: number
  ivBagLevel: number
}

export interface VitalThresholds {
  heartRate: {
    warning: { min: number; max: number }
    critical: { min: number; max: number }
  }
  spO2: {
    warning: { min: number; max: number }
    critical: { min: number; max: number }
  }
  bloodPressure: {
    warning: { systolic: number; diastolic: number }
    critical: { systolic: number; diastolic: number }
  }
  temperature: {
    warning: { min: number; max: number }
    critical: { min: number; max: number }
  }
  ivBagLevel: {
    warning: number
    critical: number
  }
}

export interface ThresholdSettings {
  serviceNo: string
  thresholds: VitalThresholds
  interval?: number // in minutes, optional
}
