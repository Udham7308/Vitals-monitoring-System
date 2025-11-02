"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, AlertTriangle, Trash2 } from "lucide-react"
import type { Patient, ThresholdSettings } from "@/lib/types"
import {
  checkCriticalAlertsWithThresholds,
  getDefaultThresholds,
  getVitalStatusWithThresholds,
} from "@/lib/threshold-utils"
import { AddPatientForm } from "@/components/add-patient-form"
import { PatientInfoDialog } from "@/components/patient-info-dialog"

interface PatientSelectorProps {
  patients: Patient[]
  selectedPatient: Patient
  onPatientSelect: (patient: Patient) => void
  onAddPatient: (patient: Patient) => void
  onDeletePatient: (patientId: string) => void
  thresholdSettings: ThresholdSettings[]
}

export function PatientSelector({
  patients,
  selectedPatient,
  onPatientSelect,
  onAddPatient,
  onDeletePatient,
  thresholdSettings,
}: PatientSelectorProps) {
  // Handle empty patients array
  if (patients.length === 0) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Patient Selection</span>
            </CardTitle>
            <AddPatientForm onAddPatient={onAddPatient} />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No patients available</p>
            <p className="text-sm text-gray-500">Add a new patient to start monitoring</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Function to calculate dynamic patient status based on vitals and thresholds
  const calculatePatientStatus = (patient: Patient): "stable" | "warning" | "critical" => {
    const patientThresholds =
      thresholdSettings.find((ts) => ts.serviceNo === patient.serviceNo)?.thresholds || getDefaultThresholds()

    // Check each vital sign against thresholds
    const vitalStatuses = [
      getVitalStatusWithThresholds("heartRate", patient.heartRate, patientThresholds),
      getVitalStatusWithThresholds("spO2", patient.spO2, patientThresholds),
      getVitalStatusWithThresholds("bloodPressure", patient.bloodPressure, patientThresholds),
      getVitalStatusWithThresholds("temperature", patient.temperature, patientThresholds),
      getVitalStatusWithThresholds("ivBagLevel", patient.ivBagLevel, patientThresholds),
    ]

    // Also check if there are any critical alerts
    const hasCriticalAlerts = patient.alerts.some((alert) => alert.severity === "critical")

    // Determine overall status - critical takes priority, then warning, then stable
    if (vitalStatuses.includes("critical") || hasCriticalAlerts) {
      return "critical"
    } else if (vitalStatuses.includes("warning")) {
      return "warning"
    } else {
      return "stable"
    }
  }

  // Create patients with calculated status
  const patientsWithCalculatedStatus = patients.map((patient) => ({
    ...patient,
    calculatedStatus: calculatePatientStatus(patient),
  }))

  // Group patients by calculated status
  const criticalPatients = patientsWithCalculatedStatus.filter((patient) => patient.calculatedStatus === "critical")
  const warningPatients = patientsWithCalculatedStatus.filter((patient) => patient.calculatedStatus === "warning")
  const stablePatients = patientsWithCalculatedStatus.filter((patient) => patient.calculatedStatus === "stable")

  const patientSections = [
    { title: "Critical Patients", patients: criticalPatients, bgColor: "bg-red-50", borderColor: "border-red-200" },
    { title: "Warning Patients", patients: warningPatients, bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
    { title: "Stable Patients", patients: stablePatients, bgColor: "bg-green-50", borderColor: "border-green-200" },
  ]

  // Helper function to render patient button (fixed nested button issue)
  const renderPatientButton = (patient: Patient & { calculatedStatus: "stable" | "warning" | "critical" }) => {
    const patientThresholds =
      thresholdSettings.find((ts) => ts.serviceNo === patient.serviceNo)?.thresholds || getDefaultThresholds()
    const hasCriticalAlerts = checkCriticalAlertsWithThresholds(patient, patientThresholds)
    const isSelected = patient.serviceNo === selectedPatient.serviceNo

    return (
      <div key={patient.serviceNo} className="relative group">
        <div
          className={`h-auto p-4 justify-start w-full text-left relative cursor-pointer rounded-md border transition-colors ${
            isSelected
              ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
              : hasCriticalAlerts
                ? "border-red-500 bg-red-50 hover:bg-red-100"
                : "bg-gray-50 hover:bg-gray-100 border-input"
          }`}
          onClick={() => onPatientSelect(patient)}
        >
          <div className="flex flex-col items-start gap-2 w-full pr-16">
            <div className="flex items-center justify-between w-full">
              <span className="font-medium text-base leading-tight">{patient.name}</span>
              <div className="flex items-center gap-1">
                {patient.bedNo && (
                  <span
                    className={`text-xs px-2 py-1 rounded ${isSelected ? "bg-gray-700 text-gray-300" : "bg-blue-100 text-blue-700"}`}
                  >
                    {patient.bedNo}
                  </span>
                )}
                {hasCriticalAlerts && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
              </div>
            </div>
            <div className={`text-sm ${isSelected ? "text-gray-300" : "text-muted-foreground"} leading-tight`}>
              {patient.serviceNo.toUpperCase()}
              {patient.rank && ` • ${patient.rank}`}
            </div>
            <Badge
              variant={
                patient.calculatedStatus === "critical"
                  ? "destructive"
                  : patient.calculatedStatus === "warning"
                    ? "secondary"
                    : isSelected
                      ? "outline"
                      : "outline"
              }
              className={`text-xs leading-tight ${
                patient.calculatedStatus === "warning"
                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                  : patient.calculatedStatus === "stable" && isSelected
                    ? "bg-white text-gray-900 border-gray-300 hover:bg-gray-100"
                    : patient.calculatedStatus === "stable"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : ""
              }`}
            >
              {patient.calculatedStatus}
            </Badge>
          </div>
        </div>
        <div className="absolute bottom-2 right-8 flex items-center gap-1">
          <PatientInfoDialog patient={patient} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDeletePatient(patient.serviceNo)
          }}
          className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:bg-red-100 transition-opacity z-10 sm:opacity-0 sm:group-hover:opacity-100"
          title="Delete patient"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  const renderDesktopPatientButton = (patient: Patient & { calculatedStatus: "stable" | "warning" | "critical" }) => {
    const patientThresholds =
      thresholdSettings.find((ts) => ts.serviceNo === patient.serviceNo)?.thresholds || getDefaultThresholds()
    const hasCriticalAlerts = checkCriticalAlertsWithThresholds(patient, patientThresholds)
    const isSelected = patient.serviceNo === selectedPatient.serviceNo

    return (
      <div key={patient.serviceNo} className="w-full min-w-0 relative group">
        <div
          className={`h-auto p-4 justify-start w-full min-w-0 cursor-pointer rounded-md border transition-colors ${
            isSelected
              ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
              : hasCriticalAlerts
                ? "border-red-500 bg-red-50 hover:bg-red-100"
                : "bg-gray-50 hover:bg-gray-100 border-input"
          }`}
          onClick={() => onPatientSelect(patient)}
        >
          <div className="flex flex-col items-start gap-1 w-full min-w-0 pr-12">
            <div className="flex items-center gap-2 w-full min-w-0">
              <span className="font-medium text-sm truncate flex-1 min-w-0 leading-tight">{patient.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {patient.bedNo && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${isSelected ? "bg-gray-700 text-gray-300" : "bg-blue-100 text-blue-700"}`}
                  >
                    {patient.bedNo}
                  </span>
                )}
                {hasCriticalAlerts && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
              </div>
            </div>
            <div className="text-xs text-muted-foreground truncate w-full leading-tight">
              {patient.serviceNo.toUpperCase()}
              {patient.rank && ` • ${patient.rank}`}
            </div>
            <Badge
              variant={
                patient.calculatedStatus === "critical"
                  ? "destructive"
                  : patient.calculatedStatus === "warning"
                    ? "secondary"
                    : "default"
              }
              className={`text-xs truncate max-w-full leading-tight ${
                patient.calculatedStatus === "warning"
                  ? "bg-yellow-500 text-white hover:bg-yellow-600"
                  : patient.calculatedStatus === "stable"
                    ? "bg-green-100 text-green-700 border-green-300"
                    : ""
              }`}
            >
              {patient.calculatedStatus}
            </Badge>
          </div>
        </div>
        <div className="absolute bottom-2 right-6 flex items-center gap-1">
          <PatientInfoDialog patient={patient} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDeletePatient(patient.serviceNo)
          }}
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 text-red-500 z-10"
          title="Delete patient"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Patient Selection</span>
          </CardTitle>
          <AddPatientForm onAddPatient={onAddPatient} />
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Mobile: Vertical stacked cards with sections */}
        <div className="block sm:hidden space-y-4">
          {patientSections.map(
            (section) =>
              section.patients.length > 0 && (
                <div key={section.title} className={`rounded-lg border ${section.borderColor} ${section.bgColor} p-3`}>
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">
                    {section.title} ({section.patients.length})
                  </h4>
                  <div className="space-y-3">{section.patients.map(renderPatientButton)}</div>
                </div>
              ),
          )}
        </div>

        {/* Desktop: Responsive grid layout with sections */}
        <div className="hidden sm:block w-full space-y-4">
          {patientSections.map(
            (section) =>
              section.patients.length > 0 && (
                <div key={section.title} className={`rounded-lg border ${section.borderColor} ${section.bgColor} p-4`}>
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">
                    {section.title} ({section.patients.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 w-full">
                    {section.patients.map(renderDesktopPatientButton)}
                  </div>
                </div>
              ),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
