import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Droplets, Thermometer, Activity, AlertTriangle } from "lucide-react"
import type { Patient, VitalThresholds } from "@/lib/types"
import { getVitalStatusWithThresholds } from "@/lib/threshold-utils"
import { ThresholdSettings } from "@/components/threshold-settings"
import { useState } from "react"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChartContainer } from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts"

interface VitalsGridProps {
  patient: Patient
  thresholds: VitalThresholds
  onThresholdsChange: (patientId: string, thresholds: VitalThresholds, interval?: number) => void // updated
  onRemoveLocalThresholds: (patientId: string) => void
  hasLocalOverride: boolean
  globalThresholds: VitalThresholds
  interval?: number // new prop
}

export function VitalsGrid({
  patient,
  thresholds,
  onThresholdsChange,
  onRemoveLocalThresholds,
  hasLocalOverride,
  globalThresholds,
  interval,
}: VitalsGridProps) {
  // Handle null patient
  if (!patient) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">No patient selected</p>
        </div>
      </div>
    )
  }

  const vitals = [
    {
      title: "Heart Rate",
      value: `${patient.heartRate}`,
      unit: "bpm",
      icon: Heart,
      status: getVitalStatusWithThresholds("heartRate", patient.heartRate, thresholds),
      normal: `${thresholds.heartRate.warning.min}-${thresholds.heartRate.warning.max} bpm`,
    },
    {
      title: "SpO₂",
      value: `${patient.spO2}`,
      unit: "%",
      icon: Activity,
      status: getVitalStatusWithThresholds("spO2", patient.spO2, thresholds),
      normal: `>${thresholds.spO2.warning.min}%`,
    },
    {
      title: "Blood Pressure",
      value: `${patient.bloodPressure.systolic}/${patient.bloodPressure.diastolic}`,
      unit: "mmHg",
      icon: Activity,
      status: getVitalStatusWithThresholds("bloodPressure", patient.bloodPressure, thresholds),
      normal: `<${thresholds.bloodPressure.warning.systolic}/${thresholds.bloodPressure.warning.diastolic} mmHg`,
    },
    {
      title: "Temperature",
      value: `${patient.temperature}`,
      unit: "°C",
      icon: Thermometer,
      status: getVitalStatusWithThresholds("temperature", patient.temperature, thresholds),
      normal: `${thresholds.temperature.warning.min}-${thresholds.temperature.warning.max}°C`,
    },
    {
      title: "IV Bag Level",
      value: `${patient.ivBagLevel}`,
      unit: "%",
      icon: Droplets,
      status: getVitalStatusWithThresholds("ivBagLevel", patient.ivBagLevel, thresholds),
      normal: `>${thresholds.ivBagLevel.warning}%`,
    },
  ]

  const [chartModalOpen, setChartModalOpen] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [chartError, setChartError] = useState<string | null>(null)
  const [chartFetched, setChartFetched] = useState(false)

  const handleGenerateChart = async () => {
    setChartModalOpen(true)
    if (!chartFetched) {
      setChartLoading(true)
      setChartError(null)
      try {
        const response = await api.getVitalsHistory(patient.serviceNo, 168) // fetch up to 7 days
        if (response.success && response.data) {
          setChartData(response.data)
          setChartFetched(true)
        } else {
          setChartError("Failed to fetch vitals data.")
        }
      } catch (err) {
        setChartError("Error fetching vitals data.")
      } finally {
        setChartLoading(false)
      }
    }
  }

  const handleCloseChartModal = () => {
    setChartModalOpen(false)
    // Do not reset chartFetched or chartData, so data is reused
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg sm:text-xl font-semibold truncate">Current Vitals - {patient.name}</h2>
          {patient.bedNo && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Bed:</span>
              <span className="text-sm font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">{patient.bedNo}</span>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <ThresholdSettings
            patient={patient}
            thresholds={thresholds}
            onThresholdsChange={onThresholdsChange}
            onRemoveLocalThresholds={onRemoveLocalThresholds}
            hasLocalOverride={hasLocalOverride}
            globalThresholds={globalThresholds}
            interval={interval} // pass interval
          />
        </div>
      </div>

      {/* Vitals Grid - Restored to original layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {vitals.map((vital) => {
          const Icon = vital.icon
          const isWarning = vital.status === "warning"
          const isCritical = vital.status === "critical"

          return (
            <Card
              key={vital.title}
              className={`${
                isCritical
                  ? "border-red-500 bg-red-50"
                  : isWarning
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-green-500 bg-green-50"
              } min-h-[160px] sm:min-h-[180px]`}
            >
              <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="text-sm sm:text-base font-medium flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
                      isCritical ? "text-red-600" : isWarning ? "text-yellow-600" : "text-green-600"
                    }`}
                  />
                  <span className="truncate">{vital.title}</span>
                  {(isWarning || isCritical) && (
                    <AlertTriangle
                      className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ml-auto ${isCritical ? "text-red-600" : "text-yellow-600"}`}
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3 sm:space-y-4">
                  {/* Value */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-none">{vital.value}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">{vital.unit}</span>
                  </div>

                  {/* Status and Normal Range */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={isCritical ? "destructive" : isWarning ? "secondary" : "default"}
                      className={`text-xs sm:text-sm px-3 py-1 ${
                        !isCritical && !isWarning ? "bg-gray-900 text-white hover:bg-gray-800" : ""
                      }`}
                    >
                      {isCritical ? "Critical" : isWarning ? "Warning" : "Normal"}
                    </Badge>
                    <span className="text-xs sm:text-sm text-muted-foreground text-right leading-tight">
                      {vital.normal}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      {/* Generate Chart Button */}
      <div className="flex justify-end mt-2">
        <Button onClick={handleGenerateChart} disabled={chartLoading}>
          {chartLoading ? "Loading..." : "Generate Chart"}
        </Button>
      </div>
      {/* Chart Modal */}
      <Dialog open={chartModalOpen} onOpenChange={handleCloseChartModal}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vital Trends for {patient.name}</DialogTitle>
          </DialogHeader>
          {chartError && <div className="text-red-500 text-sm mb-2">{chartError}</div>}
          {chartLoading && <div className="text-gray-600 text-sm mb-2">Loading charts...</div>}
          {!chartError && !chartLoading && chartData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heart Rate Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">Heart Rate</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[30, 200]} label={{ value: "bpm", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="heartRate" stroke="#8884d8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {/* SpO2 Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">SpO₂</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[70, 100]} label={{ value: "%", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="spO2" stroke="#82ca9d" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {/* Blood Pressure Systolic Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">Blood Pressure (Systolic)</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[70, 250]} label={{ value: "mmHg", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bloodPressure.systolic" stroke="#ff7300" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {/* Blood Pressure Diastolic Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">Blood Pressure (Diastolic)</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[40, 150]} label={{ value: "mmHg", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bloodPressure.diastolic" stroke="#387908" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {/* Temperature Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">Temperature</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[32, 42]} label={{ value: "°C", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="temperature" stroke="#8884d8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              {/* IV Bag Level Chart */}
              <div>
                <div className="font-semibold text-base text-center mb-2">IV Bag Level</div>
                <ChartContainer config={{}}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => t.slice(5, 16)} minTickGap={32} />
                      <YAxis domain={[0, 100]} label={{ value: "%", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="ivBagLevel" stroke="#8884d8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
