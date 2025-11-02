"use client"

import { useState, useEffect, useMemo } from "react"
import { PatientSelector } from "@/components/patient-selector"
import { VitalsGrid } from "@/components/vitals-grid"
import { TrendCharts } from "@/components/trend-charts"
import { AlertLog } from "@/components/alert-log"
import { AlertBanner } from "@/components/alert-banner"
import { GlobalThresholdSettings } from "@/components/global-threshold-settings"
import { getDefaultThresholds } from "@/lib/threshold-utils"
import type { Patient, VitalThresholds, ThresholdSettings, Alert } from "@/lib/types"
import { HistoricalData } from "@/components/historical-data"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { DeletePatientDialog } from "@/components/delete-patient-dialog"
import { AddPatientForm } from "@/components/add-patient-form"

// Extend ThresholdSettingsType to include interval
// { patientId: string, thresholds: VitalThresholds, interval?: number }

export default function Dashboard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [globalThresholds, setGlobalThresholds] = useState<VitalThresholds>(getDefaultThresholds())
  const [localThresholdSettings, setLocalThresholdSettings] = useState<ThresholdSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])

  const [currentView, setCurrentView] = useState<"dashboard" | "historical">("dashboard")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)

  // Calculate effective thresholds and intervals for each patient (local overrides global)
  const effectiveThresholdSettings = useMemo(() => {
    return patients.map((patient) => {
      const localOverride = localThresholdSettings.find((ts) => ts.serviceNo === patient.serviceNo)
      return {
        serviceNo: patient.serviceNo,
        thresholds: localOverride ? localOverride.thresholds : globalThresholds,
        interval: localOverride?.interval ?? 30, // default to 30
      }
    })
  }, [localThresholdSettings, globalThresholds, patients])

  // Get current patient's effective thresholds and interval
  const currentThresholds = selectedPatient
    ? effectiveThresholdSettings.find((ts) => ts.serviceNo === selectedPatient.serviceNo)?.thresholds ||
      globalThresholds
    : globalThresholds
  const currentInterval = selectedPatient
    ? effectiveThresholdSettings.find((ts) => ts.serviceNo === selectedPatient.serviceNo)?.interval || 30
    : 30

  // Check if current patient has local override
  const hasLocalOverride = selectedPatient
    ? localThresholdSettings.some((ts) => ts.serviceNo === selectedPatient.serviceNo)
    : false

  // Count patients affected by global settings
  const affectedPatientsCount = patients.length - localThresholdSettings.length

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load patients and global thresholds in parallel
        const [patientsResponse, thresholdsResponse] = await Promise.all([api.getPatients(), api.getGlobalThresholds()])

        if (patientsResponse.success && patientsResponse.data) {
          setPatients(patientsResponse.data)
          if (patientsResponse.data.length > 0 && !selectedPatient) {
            setSelectedPatient(patientsResponse.data[0])
          }
        }

        if (thresholdsResponse.success && thresholdsResponse.data) {
          setGlobalThresholds(thresholdsResponse.data)
        }

        // Load patient-specific thresholds
        if (patientsResponse.success && patientsResponse.data) {
          const patientThresholds = await Promise.allSettled(
            patientsResponse.data.map(async (patient: Patient) => {
              try {
                const response = await api.getPatientThresholds(patient.serviceNo)
                if (response.success && response.data) {
                  // If response.data has interval, use it; else default to 30
                  return {
                    serviceNo: patient.serviceNo,
                    thresholds: response.data.thresholds || response.data, // support both formats
                    interval: response.data.interval ?? 30,
                  }
                }
                return null
              } catch {
                return null
              }
            }),
          )
          const validThresholds = patientThresholds
            .filter(
              (result): result is PromiseFulfilledResult<ThresholdSettings | null> =>
                result.status === "fulfilled" && result.value !== null,
            )
            .map((result) => (result as PromiseFulfilledResult<ThresholdSettings | null>).value as ThresholdSettings)
          setLocalThresholdSettings(validThresholds)
        }
      } catch (err) {
        console.error("Error loading initial data:", err)
        setError("Failed to load initial data. Please check if the backend is running.")
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Real-time data updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (patients.length > 0) {
      interval = setInterval(async () => {
        try {
          const response = await api.getPatients()
          if (response.success && response.data) {
            // Ensure all vital signs are properly mapped
            const updatedPatients = response.data.map((patient: any) => ({
              ...patient,
              heartRate: patient.heartRate || 75,
              spO2: patient.spO2 || 98,
              bloodPressure: patient.bloodPressure || { systolic: 120, diastolic: 80 },
              temperature: patient.temperature || 36.5,
              ivBagLevel: patient.ivBagLevel !== undefined ? patient.ivBagLevel : 100,
              alerts: patient.alerts || [],
            }))

            setPatients(updatedPatients)

            // Only update selected patient if it still exists and we're not in the middle of patient creation
            if (selectedPatient) {
              const updatedSelectedPatient = updatedPatients.find(
                (p: Patient) => p.serviceNo === selectedPatient.serviceNo,
              )
              if (updatedSelectedPatient) {
                // Only update if the patient data has actually changed to prevent unnecessary re-renders
                const currentData = JSON.stringify({
                  heartRate: selectedPatient.heartRate,
                  spO2: selectedPatient.spO2,
                  bloodPressure: selectedPatient.bloodPressure,
                  temperature: selectedPatient.temperature,
                  ivBagLevel: selectedPatient.ivBagLevel,
                  alerts: selectedPatient.alerts,
                })
                const newData = JSON.stringify({
                  heartRate: updatedSelectedPatient.heartRate,
                  spO2: updatedSelectedPatient.spO2,
                  bloodPressure: updatedSelectedPatient.bloodPressure,
                  temperature: updatedSelectedPatient.temperature,
                  ivBagLevel: updatedSelectedPatient.ivBagLevel,
                  alerts: updatedSelectedPatient.alerts,
                })

                if (currentData !== newData) {
                  setSelectedPatient(updatedSelectedPatient)
                }
              } else {
                // Patient no longer exists, select the first available patient
                if (updatedPatients.length > 0) {
                  setSelectedPatient(updatedPatients[0])
                }
              }
            } else if (updatedPatients.length > 0 && !selectedPatient) {
              // Only set a new selected patient if none is currently selected
              setSelectedPatient(updatedPatients[0])
            }
          }
        } catch (err) {
          console.error("Error updating patient data:", err)
        }
      }, 3000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [patients, selectedPatient])

  // Fetch alerts for selected patient
  useEffect(() => {
    const fetchAlerts = async () => {
      if (selectedPatient) {
        try {
          const response = await api.getAlerts(selectedPatient.serviceNo)
          if (response.success && response.data) {
            setAlerts(response.data)
          } else {
            setAlerts([])
          }
        } catch (err) {
          setAlerts([])
        }
      } else {
        setAlerts([])
      }
    }
    fetchAlerts()
  }, [selectedPatient])

  const handleGlobalThresholdsChange = async (thresholds: VitalThresholds) => {
    try {
      const response = await api.updateGlobalThresholds(thresholds)
      if (response.success) {
        setGlobalThresholds(thresholds)
      } else {
        console.error("Failed to update global thresholds:", response.message)
      }
    } catch (err) {
      console.error("Error updating global thresholds:", err)
    }
  }

  // Update handleLocalThresholdsChange to accept interval
  const handleLocalThresholdsChange = async (serviceNo: string, thresholds: VitalThresholds, interval?: number) => {
    try {
      const response = await api.updatePatientThresholds(serviceNo, thresholds, interval)
      if (response.success) {
        setLocalThresholdSettings((prev) => {
          const existing = prev.find((ts) => ts.serviceNo === serviceNo)
          if (existing) {
            return prev.map((ts) =>
              ts.serviceNo === serviceNo ? { ...ts, thresholds, interval: interval ?? ts.interval ?? 30 } : ts
            )
          } else {
            return [...prev, { serviceNo, thresholds, interval: interval ?? 30 }]
          }
        })
      } else {
        console.error("Failed to update patient thresholds:", response.message)
      }
    } catch (err) {
      console.error("Error updating patient thresholds:", err)
    }
  }

  const handleRemoveLocalThresholds = async (serviceNo: string) => {
    try {
      const response = await api.deletePatientThresholds(serviceNo)
      if (response.success) {
        setLocalThresholdSettings((prev) => prev.filter((ts) => ts.serviceNo !== serviceNo))
      } else {
        console.error("Failed to remove patient thresholds:", response.message)
      }
    } catch (err) {
      console.error("Error removing patient thresholds:", err)
    }
  }

  const handleAddPatient = async (newPatient: Patient) => {
    try {
      const response = await api.createPatient(newPatient)
      if (response.success && response.data) {
        // Immediately set the new patient as selected to prevent switching
        const createdPatient = {
          ...response.data,
          heartRate: response.data.heartRate || 75,
          spO2: response.data.spO2 || 98,
          bloodPressure: response.data.bloodPressure || { systolic: 120, diastolic: 80 },
          temperature: response.data.temperature || 36.5,
          ivBagLevel: response.data.ivBagLevel || 100,
          alerts: response.data.alerts || [],
        }

        setSelectedPatient(createdPatient)

        // Refresh patients list after a short delay
        setTimeout(async () => {
          const patientsResponse = await api.getPatients()
          if (patientsResponse.success && patientsResponse.data) {
            setPatients(patientsResponse.data)
          }
        }, 500)
        return null
      } else {
        // Return error to form
        return { error: response.message || "Failed to create patient." }
      }
    } catch (err: any) {
      return { error: err?.message || "Failed to create patient." }
    }
  }

  const handleDeletePatient = async (serviceNo: string) => {
    const patient = patients.find((p) => p.serviceNo === serviceNo)
    if (patient) {
      setPatientToDelete(patient)
      setDeleteDialogOpen(true)
    }
  }

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return

    try {
      const response = await api.deletePatient(patientToDelete.serviceNo)
      if (response.success) {
        // Remove from local state
        const remainingPatients = patients.filter((p) => p.serviceNo !== patientToDelete.serviceNo)
        setPatients(remainingPatients)

        // If deleted patient was selected, select another one or clear selection
        if (selectedPatient?.serviceNo === patientToDelete.serviceNo) {
          if (remainingPatients.length > 0) {
            setSelectedPatient(remainingPatients[0])
          } else {
            setSelectedPatient(null)
          }
        }

        // Remove local thresholds for this patient
        setLocalThresholdSettings((prev) => prev.filter((ts) => ts.serviceNo !== patientToDelete.serviceNo))
      } else {
        console.error("Failed to delete patient:", response.message)
      }
    } catch (err) {
      console.error("Error deleting patient:", err)
    }
  }

  const handleDismissAlert = async (alertIndex: number) => {
    if (!alerts || !alerts[alertIndex] || !alerts[alertIndex]._id) return

    try {
      const response = await api.dismissAlert(alerts[alertIndex]._id)
      if (response.success) {
        // Refetch alerts for the selected patient
        if (selectedPatient) {
          const refreshed = await api.getAlerts(selectedPatient.serviceNo)
          if (refreshed.success && refreshed.data) {
            setAlerts(refreshed.data)
          }
        }
      } else {
        console.error("Failed to dismiss alert:", response.message)
      }
    } catch (err) {
      console.error("Error dismissing alert:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Connection Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!selectedPatient && patients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{"निरक्षक"}</h1>
                <p className="text-sm sm:text-base text-gray-600">Real-time patient vitals and IV bag monitoring</p>
              </div>
            </div>
          </div>

          {/* No Patients State */}
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Patients Available</h2>
              <p className="text-gray-600 mb-6">
                There are currently no patients in the system. Add a new patient to start monitoring their vitals.
              </p>
              <AddPatientForm onAddPatient={handleAddPatient} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedPatient && patients.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">{"निरक्षक"}</h1>
              <p className="text-sm sm:text-base text-gray-600">Real-time patient vitals and IV bag monitoring</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
              {/* Global Threshold Settings */}
              {currentView === "dashboard" && (
                <div className="order-2 sm:order-1">
                  <GlobalThresholdSettings
                    globalThresholds={globalThresholds}
                    onGlobalThresholdsChange={handleGlobalThresholdsChange}
                    affectedPatientsCount={affectedPatientsCount}
                    totalPatientsCount={patients.length}
                  />
                </div>
              )}
              {/* View Toggle */}
              <div className="order-1 sm:order-2 flex gap-2">
                <Button
                  variant={currentView === "dashboard" ? "default" : "outline"}
                  onClick={() => setCurrentView("dashboard")}
                  className="text-sm"
                >
                  Dashboard
                </Button>
                <Button
                  variant={currentView === "historical" ? "default" : "outline"}
                  onClick={() => setCurrentView("historical")}
                  className="text-sm"
                >
                  Historical Data
                </Button>
              </div>
            </div>
          </div>
        </div>
        {currentView === "dashboard" ? (
          <>
            {/* Alert Banner */}
            {selectedPatient && (
              <AlertBanner
                key={selectedPatient.serviceNo + (alerts.length > 0 ? alerts[0].timestamp : "")}
                patient={selectedPatient}
                thresholds={currentThresholds}
                alerts={alerts}
              />
            )}
            {/* Patient Selection */}
            <PatientSelector
              patients={patients}
              selectedPatient={selectedPatient || patients[0]}
              onPatientSelect={setSelectedPatient}
              onAddPatient={handleAddPatient}
              onDeletePatient={handleDeletePatient}
              thresholdSettings={effectiveThresholdSettings}
            />
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Vitals Display - Takes 3/4 of the width */}
              <div className="lg:col-span-3 order-1">
                {selectedPatient && (
                  <VitalsGrid
                    patient={selectedPatient}
                    thresholds={currentThresholds}
                    onThresholdsChange={handleLocalThresholdsChange}
                    onRemoveLocalThresholds={handleRemoveLocalThresholds}
                    hasLocalOverride={hasLocalOverride}
                    globalThresholds={globalThresholds}
                    interval={currentInterval}
                  />
                )}
              </div>
              {/* Alert Log - Takes 1/4 of the width */}
              <div className="lg:col-span-1 order-3 lg:order-2">
                <AlertLog alerts={alerts} onDismissAlert={handleDismissAlert} />
              </div>
            </div>
            {/* Trend Charts - removed */}
            {/* <div className="order-2 lg:order-3">
              {selectedPatient && <TrendCharts patient={selectedPatient} />}
            </div> */}
          </>
        ) : (
          <HistoricalData patients={patients} thresholdSettings={effectiveThresholdSettings} />
        )}
        <DeletePatientDialog
          patient={patientToDelete}
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setPatientToDelete(null)
          }}
          onConfirm={confirmDeletePatient}
        />
      </div>
    </div>
  )
}
