"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, RotateCcw, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { VitalThresholds, Patient } from "@/lib/types"
import { getDefaultThresholds } from "@/lib/threshold-utils"

interface ThresholdSettingsProps {
  patient: Patient
  thresholds: VitalThresholds
  onThresholdsChange: (patientId: string, thresholds: VitalThresholds, interval?: number) => void // extended
  onRemoveLocalThresholds: (patientId: string) => void
  hasLocalOverride: boolean
  globalThresholds: VitalThresholds
  interval?: number // new prop for current interval
}

const ALLOWED_INTERVALS = [10, 15, 30, 60]

export function ThresholdSettings({
  patient,
  thresholds,
  onThresholdsChange,
  onRemoveLocalThresholds,
  hasLocalOverride,
  globalThresholds,
  interval: initialInterval = 30, // default to 30
}: ThresholdSettingsProps) {
  const [localThresholds, setLocalThresholds] = useState<VitalThresholds>(thresholds)
  const [isOpen, setIsOpen] = useState(false)
  const [interval, setInterval] = useState<number>(initialInterval)
  const [intervalError, setIntervalError] = useState<string | null>(null)

  const handleSave = () => {
    if (!ALLOWED_INTERVALS.includes(interval)) {
      setIntervalError("Please select a valid interval (10, 15, 30, or 60 minutes).")
      return
    }
    setIntervalError(null)
    onThresholdsChange(patient.serviceNo, localThresholds, interval)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultThresholds = getDefaultThresholds()
    setLocalThresholds(defaultThresholds)
  }

  const handleUseGlobal = () => {
    onRemoveLocalThresholds(patient.serviceNo)
    setIsOpen(false)
  }

  const updateThreshold = (
    vital: keyof VitalThresholds,
    level: "warning" | "critical",
    field: string,
    value: number,
  ) => {
    setLocalThresholds((prev) => ({
      ...prev,
      [vital]: {
        ...prev[vital],
        [level]: {
          ...prev[vital][level],
          [field]: value,
        },
      },
    }))
  }

  const updateSimpleThreshold = (vital: "ivBagLevel", level: "warning" | "critical", value: number) => {
    setLocalThresholds((prev) => ({
      ...prev,
      [vital]: {
        ...prev[vital],
        [level]: value,
      },
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent relative flex-shrink-0">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Thresholds</span>
          {hasLocalOverride && (
            <div
              className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
              title="Custom thresholds active"
            />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-start gap-2 text-base sm:text-lg leading-tight">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
            <span className="break-words leading-tight">Individual Alert Thresholds - {patient.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-4">
              {/* Interval Selection */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="interval-select" className="text-sm font-medium flex items-center gap-2">
                  Data Fetch/Save Interval
                  <Badge variant="secondary">minutes</Badge>
                </Label>
                <select
                  id="interval-select"
                  className="border rounded px-2 py-1 text-sm w-fit"
                  value={interval}
                  onChange={e => setInterval(Number(e.target.value))}
                >
                  {ALLOWED_INTERVALS.map(val => (
                    <option key={val} value={val}>{val} minutes</option>
                  ))}
                </select>
                {intervalError && <span className="text-red-500 text-xs">{intervalError}</span>}
                <span className="text-xs text-muted-foreground">How often to fetch and save this patient's sensor data. Default: 30 minutes.</span>
              </div>
              {/* Status Information */}
              <Alert>
                <Settings className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-sm">
                  {hasLocalOverride ? (
                    <div className="space-y-1">
                      <div>
                        <strong>Status:</strong> This patient has{" "}
                        <span className="font-semibold text-blue-600">individual threshold settings</span> that override
                        the global defaults.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        These settings will take priority over any global threshold changes.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div>
                        <strong>Status:</strong> This patient is using{" "}
                        <span className="font-semibold text-green-600">global threshold settings</span>.
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Setting individual thresholds here will override the global settings for this patient only.
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="heartRate" className="w-full">
                {/* Keep all existing Tabs content exactly the same */}
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 text-xs sm:text-sm h-auto">
                  <TabsTrigger value="heartRate" className="text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight">
                    <span className="hidden sm:inline">Heart Rate</span>
                    <span className="sm:hidden">HR</span>
                  </TabsTrigger>
                  <TabsTrigger value="spO2" className="text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight">
                    SpO₂
                  </TabsTrigger>
                  <TabsTrigger value="bloodPressure" className="text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight">
                    <span className="hidden sm:inline">Blood Pressure</span>
                    <span className="sm:hidden">BP</span>
                  </TabsTrigger>
                  <TabsTrigger value="temperature" className="text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight">
                    <span className="hidden sm:inline">Temperature</span>
                    <span className="sm:hidden">Temp</span>
                  </TabsTrigger>
                  <TabsTrigger value="ivBagLevel" className="text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight">
                    <span className="hidden sm:inline">IV Bag</span>
                    <span className="sm:hidden">IV</span>
                  </TabsTrigger>
                </TabsList>

                {/* Keep all existing TabsContent sections exactly the same */}
                <TabsContent value="heartRate" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Heart Rate Thresholds (bpm)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Warning</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={localThresholds.heartRate.warning.min}
                              onChange={(e) =>
                                updateThreshold("heartRate", "warning", "min", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={localThresholds.heartRate.warning.max}
                              onChange={(e) =>
                                updateThreshold("heartRate", "warning", "max", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Critical</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={localThresholds.heartRate.critical.min}
                              onChange={(e) =>
                                updateThreshold("heartRate", "critical", "min", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={localThresholds.heartRate.critical.max}
                              onChange={(e) =>
                                updateThreshold("heartRate", "critical", "max", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      {!hasLocalOverride && (
                        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded break-words">
                          <strong>Global values:</strong> {globalThresholds.heartRate.warning.min}-
                          {globalThresholds.heartRate.warning.max} (warning), {globalThresholds.heartRate.critical.min}-
                          {globalThresholds.heartRate.critical.max} (critical)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="spO2" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        SpO₂ Thresholds (%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Warning</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={localThresholds.spO2.warning.min}
                              onChange={(e) =>
                                updateThreshold("spO2", "warning", "min", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={localThresholds.spO2.warning.max}
                              onChange={(e) =>
                                updateThreshold("spO2", "warning", "max", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Critical</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={localThresholds.spO2.critical.min}
                              onChange={(e) =>
                                updateThreshold("spO2", "critical", "min", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={localThresholds.spO2.critical.max}
                              onChange={(e) =>
                                updateThreshold("spO2", "critical", "max", Number.parseInt(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      {!hasLocalOverride && (
                        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded break-words">
                          <strong>Global values:</strong> {globalThresholds.spO2.warning.min}-
                          {globalThresholds.spO2.warning.max} (warning), {globalThresholds.spO2.critical.min}-
                          {globalThresholds.spO2.critical.max} (critical)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bloodPressure" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Blood Pressure Thresholds (mmHg)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Warning</Badge>
                            Limits
                          </Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="w-16 sm:w-20 text-sm flex-shrink-0">Systolic:</Label>
                              <Input
                                type="number"
                                value={localThresholds.bloodPressure.warning.systolic}
                                onChange={(e) =>
                                  updateThreshold(
                                    "bloodPressure",
                                    "warning",
                                    "systolic",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-16 sm:w-20 text-sm flex-shrink-0">Diastolic:</Label>
                              <Input
                                type="number"
                                value={localThresholds.bloodPressure.warning.diastolic}
                                onChange={(e) =>
                                  updateThreshold(
                                    "bloodPressure",
                                    "warning",
                                    "diastolic",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Critical</Badge>
                            Limits
                          </Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="w-16 sm:w-20 text-sm flex-shrink-0">Systolic:</Label>
                              <Input
                                type="number"
                                value={localThresholds.bloodPressure.critical.systolic}
                                onChange={(e) =>
                                  updateThreshold(
                                    "bloodPressure",
                                    "critical",
                                    "systolic",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="w-16 sm:w-20 text-sm flex-shrink-0">Diastolic:</Label>
                              <Input
                                type="number"
                                value={localThresholds.bloodPressure.critical.diastolic}
                                onChange={(e) =>
                                  updateThreshold(
                                    "bloodPressure",
                                    "critical",
                                    "diastolic",
                                    Number.parseInt(e.target.value) || 0,
                                  )
                                }
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {!hasLocalOverride && (
                        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded break-words">
                          <strong>Global values:</strong> {globalThresholds.bloodPressure.warning.systolic}/
                          {globalThresholds.bloodPressure.warning.diastolic} (warning),{" "}
                          {globalThresholds.bloodPressure.critical.systolic}/
                          {globalThresholds.bloodPressure.critical.diastolic} (critical)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="temperature" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Temperature Thresholds (°C)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Warning</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Min"
                              value={localThresholds.temperature.warning.min}
                              onChange={(e) =>
                                updateThreshold("temperature", "warning", "min", Number.parseFloat(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Max"
                              value={localThresholds.temperature.warning.max}
                              onChange={(e) =>
                                updateThreshold("temperature", "warning", "max", Number.parseFloat(e.target.value) || 0)
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Critical</Badge>
                            Range
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Min"
                              value={localThresholds.temperature.critical.min}
                              onChange={(e) =>
                                updateThreshold(
                                  "temperature",
                                  "critical",
                                  "min",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              className="text-sm"
                            />
                            <span className="text-sm">-</span>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Max"
                              value={localThresholds.temperature.critical.max}
                              onChange={(e) =>
                                updateThreshold(
                                  "temperature",
                                  "critical",
                                  "max",
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      {!hasLocalOverride && (
                        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded break-words">
                          <strong>Global values:</strong> {globalThresholds.temperature.warning.min}-
                          {globalThresholds.temperature.warning.max} (warning),{" "}
                          {globalThresholds.temperature.critical.min}-{globalThresholds.temperature.critical.max}{" "}
                          (critical)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ivBagLevel" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        IV Bag Level Thresholds (%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary">Warning</Badge>
                            Below
                          </Label>
                          <Input
                            type="number"
                            value={localThresholds.ivBagLevel.warning}
                            onChange={(e) =>
                              updateSimpleThreshold("ivBagLevel", "warning", Number.parseInt(e.target.value) || 0)
                            }
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-sm">
                            <Badge variant="destructive">Critical</Badge>
                            Below
                          </Label>
                          <Input
                            type="number"
                            value={localThresholds.ivBagLevel.critical}
                            onChange={(e) =>
                              updateSimpleThreshold("ivBagLevel", "critical", Number.parseInt(e.target.value) || 0)
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                      {!hasLocalOverride && (
                        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded break-words">
                          <strong>Global values:</strong> {globalThresholds.ivBagLevel.warning} (warning),{" "}
                          {globalThresholds.ivBagLevel.critical} (critical)
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-4 gap-2 flex-shrink-0 border-t bg-white">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent text-sm">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset to Defaults</span>
              <span className="sm:hidden">Reset</span>
            </Button>
            {hasLocalOverride && (
              <Button
                variant="outline"
                onClick={handleUseGlobal}
                className="gap-2 text-blue-600 border-blue-200 bg-transparent text-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Use Global Settings</span>
                <span className="sm:hidden">Use Global</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2 text-sm">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save Individual Settings</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
