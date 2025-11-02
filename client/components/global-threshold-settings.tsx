"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, RotateCcw, Globe, Users } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { VitalThresholds } from "@/lib/types"
import { getDefaultThresholds } from "@/lib/threshold-utils"

interface GlobalThresholdSettingsProps {
  globalThresholds: VitalThresholds
  onGlobalThresholdsChange: (thresholds: VitalThresholds) => void
  affectedPatientsCount: number
  totalPatientsCount: number
}

export function GlobalThresholdSettings({
  globalThresholds,
  onGlobalThresholdsChange,
  affectedPatientsCount,
  totalPatientsCount,
}: GlobalThresholdSettingsProps) {
  const [localThresholds, setLocalThresholds] = useState<VitalThresholds>(globalThresholds)
  const [isOpen, setIsOpen] = useState(false)

  const handleSave = () => {
    onGlobalThresholdsChange(localThresholds)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultThresholds = getDefaultThresholds()
    setLocalThresholds(defaultThresholds)
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

  const unaffectedCount = totalPatientsCount - affectedPatientsCount

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent flex-shrink-0">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Global Thresholds</span>
          <span className="sm:hidden">Global</span>
          <Badge variant="secondary" className="ml-1 text-xs">
            {affectedPatientsCount}/{totalPatientsCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-start gap-2 text-base sm:text-lg leading-tight">
            <Globe className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
            <span className="break-words leading-tight">Global Alert Thresholds</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-4">
              {/* Impact Information */}
              <Alert>
                <Users className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="text-sm">
                  <div className="space-y-1">
                    <div>
                      <strong>Impact:</strong> These settings will apply to{" "}
                      <span className="font-semibold text-blue-600">{affectedPatientsCount} patients</span> who don't
                      have individual threshold overrides.
                    </div>
                    {unaffectedCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {unaffectedCount} patient{unaffectedCount > 1 ? "s" : ""} will keep their individual settings
                        and remain unaffected.
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Keep all existing Tabs content exactly the same */}
              <Tabs defaultValue="heartRate" className="w-full">
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
                        Global Heart Rate Thresholds (bpm)
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="spO2" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Global SpO₂ Thresholds (%)
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bloodPressure" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Global Blood Pressure Thresholds (mmHg)
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
                              <Label className="w-20">Systolic:</Label>
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
                              <Label className="w-20">Diastolic:</Label>
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
                              <Label className="w-20">Systolic:</Label>
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
                              <Label className="w-20">Diastolic:</Label>
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="temperature" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Global Temperature Thresholds (°C)
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
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ivBagLevel" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base sm:text-lg leading-tight break-words">
                        Global IV Bag Level Thresholds (%)
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
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col sm:flex-row justify-between pt-4 gap-2 flex-shrink-0 border-t bg-white">
          <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent text-sm">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset to Defaults</span>
            <span className="sm:hidden">Reset</span>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="text-sm">
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2 text-sm">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Apply Global Settings</span>
              <span className="sm:hidden">Apply</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
