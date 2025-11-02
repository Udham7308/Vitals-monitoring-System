"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Info, User, Shield, MapPin, Phone, Users, Hash, Bed, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Patient } from "@/lib/types"

interface PatientInfoDialogProps {
  patient: Patient
}

export function PatientInfoDialog({ patient }: PatientInfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100 text-blue-600"
          title="View patient information"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-5 w-5 flex-shrink-0" />
            Patient Information - {patient.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-6">
              {/* Service Information */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <h3 className="text-base font-semibold">Service Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        Service Number
                      </div>
                      <div className="text-sm font-medium">{patient.serviceNo || "Not provided"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Bed className="h-3 w-3" />
                        Bed Number
                      </div>
                      <div className="text-sm font-medium">{patient.bedNo || "Not assigned"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        Service
                      </div>
                      <div className="text-sm">
                        {patient.service ? (
                          <Badge variant="outline" className="text-xs">
                            {patient.service}
                          </Badge>
                        ) : (
                          "Not provided"
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        Rank
                      </div>
                      <div className="text-sm font-medium">{patient.rank || "Not provided"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-green-600" />
                    <h3 className="text-base font-semibold">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-3 w-3" />
                        Full Name
                      </div>
                      <div className="text-sm font-medium">{patient.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Unit
                      </div>
                      <div className="text-sm font-medium">{patient.unit || "Not provided"}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        Contact Number
                      </div>
                      <div className="text-sm font-medium">{patient.contactNo || "Not provided"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="h-4 w-4 text-orange-600" />
                    <h3 className="text-base font-semibold">Emergency Contact</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Next of Kin
                    </div>
                    <div className="text-sm font-medium">{patient.nextOfKin || "Not provided"}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              {patient.remarks && (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h3 className="text-base font-semibold">Remarks</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">{patient.remarks}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Information */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash className="h-4 w-4 text-gray-600" />
                    <h3 className="text-base font-semibold">System Information</h3>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      Service Number
                    </div>
                    <div className="text-sm font-mono bg-gray-50 p-2 rounded text-xs">{patient.serviceNo}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
