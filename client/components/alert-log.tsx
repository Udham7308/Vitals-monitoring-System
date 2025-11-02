"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, Clock, X } from "lucide-react"
import type { Alert } from "@/lib/types"

interface AlertLogProps {
  alerts: Alert[]
  onDismissAlert?: (alertIndex: number) => void
}

export function AlertLog({ alerts, onDismissAlert }: AlertLogProps) {
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const handleDismiss = (index: number) => {
    if (onDismissAlert) {
      // Find the original index in the unsorted alerts array
      const alertToDismiss = sortedAlerts[index]
      const originalIndex = alerts.findIndex(
        (alert) => alert.timestamp === alertToDismiss.timestamp && alert.message === alertToDismiss.message,
      )
      if (originalIndex !== -1) {
        onDismissAlert(originalIndex)
      }
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] sm:h-[400px] lg:h-[450px] w-full">
          <div className="space-y-3 pr-2">
            {sortedAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent alerts</p>
            ) : (
              sortedAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border bg-card relative group">
                  <AlertTriangle
                    className={`h-4 w-4 mt-1 flex-shrink-0 ${
                      alert.severity === "critical" ? "text-red-500" : "text-yellow-500"
                    }`}
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Badge Row */}
                    <div className="flex items-center justify-start">
                      <Badge
                        variant={alert.severity === "critical" ? "destructive" : "secondary"}
                        className="text-sm px-3 py-1 w-fit"
                      >
                        {alert.severity}
                      </Badge>
                    </div>

                    {/* Alert Message */}
                    <p className="text-sm sm:text-base break-words leading-relaxed pr-8">{alert.message}</p>

                    {/* Date/Time Row */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pt-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>
                        {new Date(alert.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {/* Dismiss Button */}
                  {onDismissAlert && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(index)}
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 flex-shrink-0"
                      title="Dismiss alert"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
