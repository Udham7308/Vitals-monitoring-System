"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import type { Patient, VitalThresholds } from "@/lib/types"
import type { Alert as AlertType } from "@/lib/types"
import { checkCriticalAlertsWithThresholds } from "@/lib/threshold-utils"

interface AlertBannerProps {
  patient: Patient
  thresholds: VitalThresholds
  alerts?: AlertType[]
}

export function AlertBanner({ patient, thresholds, alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Handle null patient
  if (!patient) {
    return null
  }

  // Use provided alerts or fallback to patient.alerts
  const alertList = alerts || patient.alerts

  // Check for critical alerts in the provided list
  const hasCriticalAlerts = alertList.some((alert) => alert.severity === "critical")

  if (!hasCriticalAlerts || dismissed) {
    return null
  }

  const criticalAlerts = alertList.filter((alert) => alert.severity === "critical")

  return (
    <Alert variant="destructive" className="border-red-500 bg-red-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>Critical Alert for {patient.name}:</strong>{" "}
          {criticalAlerts[0]?.message || "Multiple critical conditions detected"}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="h-auto p-1 hover:bg-red-100">
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
