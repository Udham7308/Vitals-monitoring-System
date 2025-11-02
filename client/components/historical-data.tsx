"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  CalendarIcon,
  Filter,
  Download,
  Clock,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  AlertTriangle,
  User,
  FileText,
} from "lucide-react"
import type { Patient, VitalThresholds } from "@/lib/types"
import { api } from "@/lib/api"
import { getVitalStatusWithThresholds, getDefaultThresholds } from "@/lib/threshold-utils"

interface HistoricalDataProps {
  patients: Patient[]
  thresholdSettings: Array<{ serviceNo: string; thresholds: VitalThresholds }>
}

interface HistoricalLog {
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

export function HistoricalData({ patients, thresholdSettings }: HistoricalDataProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<string>("all")
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [vitalFilter, setVitalFilter] = useState<string>("all")
  const [historicalLogs, setHistoricalLogs] = useState<HistoricalLog[]>([])
  const [loading, setLoading] = useState(true)

  // Load historical data from API
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setLoading(true)
        const allLogs: HistoricalLog[] = []

        // Load vitals history for each patient - limit to last 24 hours for performance
        for (const patient of patients.slice(0, 5)) {
          // Limit to first 5 patients for performance
          try {
            const response = await api.getVitalsHistory(patient.serviceNo, 24) // Only 24 hours
            if (response.success && response.data) {
              // Take only last 10 records per patient to limit total records
              const limitedData = response.data.slice(0, 10)

              // Transform vitals data to historical logs
              const patientLogs = limitedData.flatMap((vital: any, index: number) => {
                const patientThresholds =
                  thresholdSettings.find((ts) => ts.serviceNo === patient.serviceNo)?.thresholds ||
                  getDefaultThresholds()

                const vitals = [
                  { type: "heartRate", value: vital.heartRate, unit: "bpm", name: "Heart Rate" },
                  { type: "spO2", value: vital.spO2, unit: "%", name: "SpO₂" },
                  { type: "bloodPressure", value: vital.bloodPressure, unit: "mmHg", name: "Blood Pressure" },
                  { type: "temperature", value: vital.temperature, unit: "°C", name: "Temperature" },
                  { type: "ivBagLevel", value: vital.ivBagLevel, unit: "%", name: "IV Bag Level" },
                ]

                return vitals.map((v) => {
                  // Calculate severity based on thresholds
                  const severity = getVitalStatusWithThresholds(v.type, v.value, patientThresholds)

                  return {
                    id: `${patient.serviceNo}-${v.type}-${vital.timestamp}-${index}`,
                    serviceNo: patient.serviceNo,
                    patientName: patient.name,
                    timestamp: vital.timestamp,
                    vitalType: v.type,
                    currentValue:
                      v.type === "bloodPressure"
                        ? `${v.value.systolic}/${v.value.diastolic} ${v.unit}`
                        : `${v.value} ${v.unit}`,
                    severity: severity,
                    description: `${v.name} reading recorded: ${
                      v.type === "bloodPressure"
                        ? `${v.value.systolic}/${v.value.diastolic} ${v.unit}`
                        : `${v.value} ${v.unit}`
                    }`,
                  }
                })
              })

              allLogs.push(...patientLogs)
            }
          } catch (error) {
            console.error(`Error loading data for patient ${patient.serviceNo}:`, error)
          }
        }

        // Sort by timestamp (newest first) and limit to 20 total records
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setHistoricalLogs(allLogs.slice(0, 20)) // Limit to 20 records total
      } catch (error) {
        console.error("Error loading historical data:", error)
      } finally {
        setLoading(false)
      }
    }

    // Only load when patients change significantly
    if (patients.length > 0) {
      loadHistoricalData()
    }
  }, [patients.length]) // Only depend on patient count, not full array

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    if (historicalLogs.length === 0) return []

    return historicalLogs.filter((log) => {
      // Search filter
      if (
        searchTerm &&
        !log.patientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !log.serviceNo?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false
      }

      // Patient filter
      if (selectedPatient !== "all" && log.serviceNo !== selectedPatient) {
        return false
      }

      // Date filter
      if (selectedDate) {
        const logDate = new Date(log.timestamp).toDateString()
        const filterDate = selectedDate.toDateString()
        if (logDate !== filterDate) {
          return false
        }
      }

      // Severity filter
      if (severityFilter !== "all" && log.severity !== severityFilter) {
        return false
      }

      // Vital filter
      if (vitalFilter !== "all" && log.vitalType !== vitalFilter) {
        return false
      }

      return true
    })
  }, [historicalLogs, searchTerm, selectedPatient, selectedDate, severityFilter, vitalFilter])

  const handleExport = () => {
    const csvContent = [
      // CSV Header
      "Timestamp,Service No,Patient Name,Vital Type,Current Value,Severity,Description",
      // CSV Data
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          log.serviceNo,
          log.patientName,
          log.vitalType,
          log.currentValue,
          log.severity,
          `"${log.description}"`,
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

  const getVitalIcon = (vitalType: string) => {
    switch (vitalType) {
      case "heartRate":
        return Heart
      case "spO2":
        return Activity
      case "bloodPressure":
        return Activity
      case "temperature":
        return Thermometer
      case "ivBagLevel":
        return Droplets
      default:
        return FileText
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200"
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "normal":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString()
    } catch {
      return timestamp
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Historical Data & Patient Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden">
      {/* Header */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Historical Data & Patient Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Search - Full width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, bed ID, or service number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Patient Filter */}
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="All Patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Patients</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.serviceNo} value={patient.serviceNo}>
                    <span className="truncate">{patient.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal bg-transparent min-w-0">
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{selectedDate ? selectedDate.toLocaleDateString() : "Select date"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                <div className="p-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)} className="w-full">
                    Clear Date
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Severity Filter */}
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>

            {/* Vital Filter */}
            <Select value={vitalFilter} onValueChange={setVitalFilter}>
              <SelectTrigger className="min-w-0">
                <SelectValue placeholder="Filter by Vital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vitals</SelectItem>
                <SelectItem value="heartRate">Heart Rate</SelectItem>
                <SelectItem value="spO2">SpO₂</SelectItem>
                <SelectItem value="bloodPressure">Blood Pressure</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="ivBagLevel">IV Bag Level</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>

          {/* Results Count */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>{filteredLogs.length} records found</span>
          </div>
        </CardContent>
      </Card>

      {/* Historical Logs */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg">Patient Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px] sm:h-[500px] lg:h-[600px] w-full">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground px-4">
                <FileText className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 opacity-50" />
                <p className="text-sm">No historical data found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 p-4">
                {filteredLogs.map((log, index) => {
                  const VitalIcon = getVitalIcon(log.vitalType)
                  const severityClass = getSeverityColor(log.severity)

                  return (
                    <div key={index} className={`p-3 sm:p-4 rounded-lg border ${severityClass} overflow-hidden`}>
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          {/* Icon and Vital Type */}
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <VitalIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <Badge variant="outline" className="text-xs">
                              {log.vitalType === "heartRate"
                                ? "HR"
                                : log.vitalType === "spO2"
                                  ? "SpO₂"
                                  : log.vitalType === "bloodPressure"
                                    ? "BP"
                                    : log.vitalType === "temperature"
                                      ? "TEMP"
                                      : log.vitalType === "ivBagLevel"
                                        ? "IV"
                                        : log.vitalType}
                            </Badge>
                          </div>

                          {/* Patient Info and Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 min-w-0">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="font-medium text-xs sm:text-sm truncate">{log.patientName}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                ({log.serviceNo.toUpperCase()})
                              </span>
                            </div>

                            <div className="text-xs sm:text-sm mb-2">
                              <span className="font-medium break-words">{log.description}</span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1 min-w-0">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{formatTimestamp(log.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Severity Badge */}
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {log.severity === "critical" && (
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                          )}
                          <Badge
                            variant={
                              log.severity === "critical"
                                ? "destructive"
                                : log.severity === "warning"
                                  ? "secondary"
                                  : "default"
                            }
                            className="text-xs"
                          >
                            {log.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
