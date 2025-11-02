"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Plus, User, Phone, Users, Shield, MapPin, Hash, Bed, FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Patient } from "@/lib/types"

interface AddPatientFormProps {
  onAddPatient: (patient: Patient) => Promise<{ error?: string } | null>
}

interface PatientFormData {
  serviceNo: string
  service: "Army" | "Navy" | "Air Force" | ""
  rank: string
  name: string
  unit: string
  contactNo: string
  nextOfKin: string
  bedNo: string
  remarks: string
}

// Allow errors to be any string for any field
type PatientFormErrors = {
  [K in keyof PatientFormData]?: string
}

const serviceRanks = {
  Army: [
    "Private (Pvt)",
    "Private First Class (PFC)",
    "Lance Corporal (LCpl)",
    "Corporal (Cpl)",
    "Sergeant (Sgt)",
    "Staff Sergeant (SSgt)",
    "Sergeant First Class (SFC)",
    "Master Sergeant (MSG)",
    "First Sergeant (1SG)",
    "Sergeant Major (SGM)",
    "Command Sergeant Major (CSM)",
    "Sergeant Major of the Army (SMA)",
    "Second Lieutenant (2LT)",
    "First Lieutenant (1LT)",
    "Captain (CPT)",
    "Major (MAJ)",
    "Lieutenant Colonel (LTC)",
    "Colonel (COL)",
    "Brigadier General (BG)",
    "Major General (MG)",
    "Lieutenant General (LTG)",
    "General (GEN)",
    "General of the Army (GA)",
  ],
  Navy: [
    "Seaman Recruit (SR)",
    "Seaman Apprentice (SA)",
    "Seaman (SN)",
    "Petty Officer Third Class (PO3)",
    "Petty Officer Second Class (PO2)",
    "Petty Officer First Class (PO1)",
    "Chief Petty Officer (CPO)",
    "Senior Chief Petty Officer (SCPO)",
    "Master Chief Petty Officer (MCPO)",
    "Command Master Chief Petty Officer (CMDCM)",
    "Master Chief Petty Officer of the Navy (MCPON)",
    "Ensign (ENS)",
    "Lieutenant Junior Grade (LTJG)",
    "Lieutenant (LT)",
    "Lieutenant Commander (LCDR)",
    "Commander (CDR)",
    "Captain (CAPT)",
    "Rear Admiral Lower Half (RDML)",
    "Rear Admiral Upper Half (RADM)",
    "Vice Admiral (VADM)",
    "Admiral (ADM)",
    "Fleet Admiral (FADM)",
  ],
  "Air Force": [
    "Airman Basic (AB)",
    "Airman (Amn)",
    "Airman First Class (A1C)",
    "Senior Airman (SrA)",
    "Staff Sergeant (SSgt)",
    "Technical Sergeant (TSgt)",
    "Master Sergeant (MSgt)",
    "Senior Master Sergeant (SMSgt)",
    "Chief Master Sergeant (CMSgt)",
    "Command Chief Master Sergeant (CCM)",
    "Chief Master Sergeant of the Air Force (CMSAF)",
    "Second Lieutenant (2Lt)",
    "First Lieutenant (1Lt)",
    "Captain (Capt)",
    "Major (Maj)",
    "Lieutenant Colonel (Lt Col)",
    "Colonel (Col)",
    "Brigadier General (Brig Gen)",
    "Major General (Maj Gen)",
    "Lieutenant General (Lt Gen)",
    "General (Gen)",
    "General of the Air Force (GAF)",
  ],
}

export function AddPatientForm({ onAddPatient }: AddPatientFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<PatientFormData>({
    serviceNo: "",
    service: "",
    rank: "",
    name: "",
    unit: "",
    contactNo: "",
    nextOfKin: "",
    bedNo: "",
    remarks: "",
  })
  const [errors, setErrors] = useState<PatientFormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      // Reset rank when service changes
      if (field === "service") {
        newData.rank = ""
      }
      return newData
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: PatientFormErrors = {}

    if (!formData.serviceNo.trim()) newErrors.serviceNo = "Service Number is required"
    if (!formData.service) newErrors.service = "Service is required"
    if (!formData.rank) newErrors.rank = "Rank is required"
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.unit.trim()) newErrors.unit = "Unit is required"
    if (!formData.contactNo.trim()) newErrors.contactNo = "Contact Number is required"
    if (!formData.nextOfKin.trim()) newErrors.nextOfKin = "Next of Kin is required"
    if (!formData.bedNo.trim()) newErrors.bedNo = "Bed Number is required"

    // Validate contact number format (basic validation)
    if (formData.contactNo && !/^\+?[\d\s\-()]{10,}$/.test(formData.contactNo)) {
      newErrors.contactNo = "Please enter a valid contact number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Create new patient object with default vital signs
    const newPatient: Patient = {
      serviceNo: formData.serviceNo,
      name: formData.name,
      heartRate: 75,
      spO2: 98,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 36.5,
      ivBagLevel: 100,
      status: "stable",
      alerts: [],
      service: formData.service as "Army" | "Navy" | "Air Force",
      rank: formData.rank,
      unit: formData.unit,
      contactNo: formData.contactNo,
      nextOfKin: formData.nextOfKin,
      bedNo: formData.bedNo,
      remarks: formData.remarks,
    }

    // Try to add patient and handle backend errors
    try {
      const result = await onAddPatient(newPatient)
      if (result && result.error) {
        setSubmitError(result.error)
        return
      } else {
        setSubmitError(null)
      }
      // Reset form and close dialog
      setFormData({
        serviceNo: "",
        service: "",
        rank: "",
        name: "",
        unit: "",
        contactNo: "",
        nextOfKin: "",
        bedNo: "",
        remarks: "",
      })
      setErrors({})
      setIsOpen(false)
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to add patient. Please try again.")
    }
  }

  const handleCancel = () => {
    setFormData({
      serviceNo: "",
      service: "",
      rank: "",
      name: "",
      unit: "",
      contactNo: "",
      nextOfKin: "",
      bedNo: "",
      remarks: "",
    })
    setErrors({})
    setIsOpen(false)
  }

  const availableRanks = formData.service ? serviceRanks[formData.service] : []

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent flex-shrink-0">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Patient</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-5 w-5 flex-shrink-0" />
            Add New Patient
          </DialogTitle>
        </DialogHeader>

        {/* Show submit error if present */}
        {submitError && (
          <div className="bg-red-100 text-red-700 rounded px-4 py-2 mb-4 border border-red-300">
            {submitError}
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[60vh] w-full pr-4">
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Information */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h3 className="text-base font-semibold">Service Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serviceNo" className="flex items-center gap-2 text-sm font-medium">
                          <Hash className="h-3 w-3" />
                          Service Number *
                        </Label>
                        <Input
                          id="serviceNo"
                          value={formData.serviceNo}
                          onChange={(e) => handleInputChange("serviceNo", e.target.value)}
                          placeholder="e.g., 12345678"
                          className={errors.serviceNo ? "border-red-500" : ""}
                        />
                        {errors.serviceNo && <p className="text-xs text-red-500">{errors.serviceNo}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bedNo" className="flex items-center gap-2 text-sm font-medium">
                          <Bed className="h-3 w-3" />
                          Bed Number *
                        </Label>
                        <Input
                          id="bedNo"
                          value={formData.bedNo}
                          onChange={(e) => handleInputChange("bedNo", e.target.value)}
                          placeholder="e.g., A-101, B-205"
                          className={errors.bedNo ? "border-red-500" : ""}
                        />
                        {errors.bedNo && <p className="text-xs text-red-500">{errors.bedNo}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service" className="flex items-center gap-2 text-sm font-medium">
                          <Shield className="h-3 w-3" />
                          Service *
                        </Label>
                        <Select value={formData.service} onValueChange={(value) => handleInputChange("service", value)}>
                          <SelectTrigger className={errors.service ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Army">Army</SelectItem>
                            <SelectItem value="Navy">Navy</SelectItem>
                            <SelectItem value="Air Force">Air Force</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.service && <p className="text-xs text-red-500">{errors.service}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rank" className="flex items-center gap-2 text-sm font-medium">
                          <Shield className="h-3 w-3" />
                          Rank *
                        </Label>
                        <Select
                          value={formData.rank}
                          onValueChange={(value) => handleInputChange("rank", value)}
                          disabled={!formData.service}
                        >
                          <SelectTrigger className={errors.rank ? "border-red-500" : ""}>
                            <SelectValue placeholder={formData.service ? "Select rank" : "Select service first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRanks.map((rank) => (
                              <SelectItem key={rank} value={rank}>
                                {rank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.rank && <p className="text-xs text-red-500">{errors.rank}</p>}
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
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-3 w-3" />
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="e.g., John Smith"
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit" className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-3 w-3" />
                          Unit *
                        </Label>
                        <Input
                          id="unit"
                          value={formData.unit}
                          onChange={(e) => handleInputChange("unit", e.target.value)}
                          placeholder="e.g., 1st Infantry Division"
                          className={errors.unit ? "border-red-500" : ""}
                        />
                        {errors.unit && <p className="text-xs text-red-500">{errors.unit}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactNo" className="flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-3 w-3" />
                          Contact Number *
                        </Label>
                        <Input
                          id="contactNo"
                          value={formData.contactNo}
                          onChange={(e) => handleInputChange("contactNo", e.target.value)}
                          placeholder="e.g., +1-555-123-4567"
                          className={errors.contactNo ? "border-red-500" : ""}
                        />
                        {errors.contactNo && <p className="text-xs text-red-500">{errors.contactNo}</p>}
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
                    <div className="space-y-2">
                      <Label htmlFor="nextOfKin" className="flex items-center gap-2 text-sm font-medium">
                        <Users className="h-3 w-3" />
                        Next of Kin *
                      </Label>
                      <Input
                        id="nextOfKin"
                        value={formData.nextOfKin}
                        onChange={(e) => handleInputChange("nextOfKin", e.target.value)}
                        placeholder="e.g., Jane Smith (Spouse) - +1-555-987-6543"
                        className={errors.nextOfKin ? "border-red-500" : ""}
                      />
                      {errors.nextOfKin && <p className="text-xs text-red-500">{errors.nextOfKin}</p>}
                      <p className="text-xs text-muted-foreground">Include relationship and contact information</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Remarks Section */}
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <h3 className="text-base font-semibold">Additional Information</h3>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="remarks" className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-3 w-3" />
                        Remarks
                      </Label>
                      <Textarea
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => handleInputChange("remarks", e.target.value)}
                        placeholder="Any additional notes, medical conditions, or special instructions..."
                        className="min-h-[80px] resize-none"
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">{formData.remarks.length}/500 characters</p>
                    </div>
                  </CardContent>
                </Card>
              </form>
            </div>
          </ScrollArea>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0 bg-white">
          <Button type="button" variant="outline" onClick={handleCancel} className="text-sm bg-transparent">
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} className="gap-2 text-sm">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
