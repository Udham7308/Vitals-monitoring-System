"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertTriangle, Trash2 } from "lucide-react"
import type { Patient } from "@/lib/types"

interface DeletePatientDialogProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeletePatientDialog({ patient, isOpen, onClose, onConfirm }: DeletePatientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }

  if (!patient) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Patient
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-left space-y-3 pt-2">
              <div>Are you sure you want to delete this patient?</div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="font-medium">{patient.name}</div>
                <div className="text-sm text-muted-foreground">
                  {patient.serviceNo.toUpperCase()} • {patient.rank}
                </div>
                {patient.serviceNo && (
                  <div className="text-sm text-muted-foreground">Service No: {patient.serviceNo}</div>
                )}
              </div>
              <div className="text-red-600 font-medium">
                This action cannot be undone. All patient data, vitals history, and alerts will be permanently removed.
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting} className="gap-2">
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete Patient"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
