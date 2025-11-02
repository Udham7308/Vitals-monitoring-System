"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"
import type { Patient } from "@/lib/types"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface TrendChartsProps {
  patient: Patient
}

export function TrendCharts({ patient }: TrendChartsProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        setLoading(true)
        const response = await api.getVitalsHistory(patient.serviceNo, 24)
        if (response.success && response.data) {
          // Transform the data to match the expected format
          const transformedData = response.data
            .map((vital: any) => ({
              time: vital.timestamp,
              heartRate: vital.heartRate,
              spO2: vital.spO2,
              temperature: vital.temperature,
              ivBagLevel: vital.ivBagLevel,
            }))
            .reverse() // Reverse to show chronological order

          setHistoricalData(transformedData)
        }
      } catch (error) {
        console.error("Error loading historical data:", error)
        setHistoricalData([])
      } finally {
        setLoading(false)
      }
    }

    if (patient.serviceNo) {
      loadHistoricalData()
    }
  }, [patient.serviceNo])

  const charts = [
    {
      title: "Heart Rate Trend",
      dataKey: "heartRate",
      color: "red",
      unit: "bpm",
    },
    {
      title: "SpO₂ Trend",
      dataKey: "spO2",
      color: "green",
      unit: "%",
    },
    {
      title: "Temperature Trend",
      dataKey: "temperature",
      color: "orange",
      unit: "°C",
    },
    {
      title: "IV Bag Level",
      dataKey: "ivBagLevel",
      color: "pink",
      unit: "%",
    },
  ]

  if (!patient) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold">24-Hour Trends</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">No patient selected</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold">24-Hour Trends - {patient.name}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {charts.map((chart) => (
            <Card key={chart.title}>
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-sm sm:text-base">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[150px] sm:h-[200px] w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">24-Hour Trends - {patient.name}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {charts.map((chart) => (
          <Card key={chart.title}>
            <CardHeader className="pb-2 sm:pb-6">
              <CardTitle className="text-sm sm:text-base">{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  [chart.dataKey]: {
                    label: chart.title,
                    color: chart.color,
                  },
                }}
                className="h-[150px] sm:h-[200px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis
                      dataKey="time"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      }
                      fontSize={10}
                      tickMargin={5}
                    />
                    <YAxis fontSize={10} tickMargin={5} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line
                      type="monotone"
                      dataKey={chart.dataKey}
                      stroke={chart.color}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
