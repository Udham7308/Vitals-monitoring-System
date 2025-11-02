const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  count?: number
}

export const api = {
  // Patients
  getPatients: async (): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/patients`)
    return response.json()
  },

  getPatient: async (serviceNo: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/patients/${serviceNo}`)
    return response.json()
  },

  createPatient: async (data: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/patients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updatePatient: async (serviceNo: string, data: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/patients/${serviceNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  deletePatient: async (serviceNo: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/patients/${serviceNo}`, {
      method: "DELETE",
    })
    return response.json()
  },

  // Vitals
  getVitals: async (serviceNo: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/vitals/${serviceNo}`)
    return response.json()
  },

  getVitalsHistory: async (serviceNo: string, hours = 24): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/vitals/${serviceNo}/history?hours=${hours}`)
    return response.json()
  },

  addVitals: async (serviceNo: string, data: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/vitals/${serviceNo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Alerts
  getAlerts: async (serviceNo: string): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${serviceNo}`)
    return response.json()
  },

  createAlert: async (serviceNo: string, data: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${serviceNo}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  dismissAlert: async (alertId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/dismiss`, {
      method: "PUT",
    })
    return response.json()
  },

  // Thresholds
  getGlobalThresholds: async (): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/thresholds/global`)
    return response.json()
  },

  updateGlobalThresholds: async (data: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/thresholds/global`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  getPatientThresholds: async (serviceNo: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/thresholds/${serviceNo}`)
    return response.json()
  },

  updatePatientThresholds: async (serviceNo: string, data: any, interval?: number): Promise<ApiResponse<any>> => {
    // Remove _id if present
    const { _id, ...dataWithoutId } = data
    // Attach interval if provided
    const payload = interval !== undefined ? { ...dataWithoutId, interval } : dataWithoutId
    const response = await fetch(`${API_BASE_URL}/thresholds/${serviceNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return response.json()
  },

  deletePatientThresholds: async (patientId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/thresholds/${patientId}`, {
      method: "DELETE",
    })
    return response.json()
  },
}
