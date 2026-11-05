import { request } from "@/lib/api/client"
import type { PageResponse } from "@/lib/api/page"

// 對應後端的 VitalSignResponse；時間是 yyyy-MM-dd HH:mm（台灣時間）
export type VitalSign = {
  id: number
  patientId: number
  medicalRecordNo: string
  name: string
  measuredAt: string
  bodyTemperature: number
  heartRate: number
  respiratoryRate: number
  systolicPressure: number
  diastolicPressure: number
  oxygenSaturation: number
}

export type VitalSignValuesRequest = {
  measuredAt: string
  bodyTemperature: number
  heartRate: number
  respiratoryRate: number
  systolicPressure: number
  diastolicPressure: number
  oxygenSaturation: number
}

export type PatientOption = {
  id: number
  medicalRecordNo: string
  name: string
}

export function listVitalSigns({ page, keyword }: { page: number; keyword: string }) {
  const params = new URLSearchParams({ page: String(page) })
  if (keyword) params.set("keyword", keyword)
  return request<PageResponse<VitalSign>>(`/api/vital-signs?${params}`)
}

export function searchPatientOptions(keyword: string) {
  const params = new URLSearchParams({ keyword })
  return request<{ content: PatientOption[]; hasMore: boolean }>(`/api/vital-signs/patient-options?${params}`)
}

export function createVitalSign(body: VitalSignValuesRequest & { patientId: number }) {
  return request<VitalSign>("/api/vital-signs", { method: "POST", body })
}

export function updateVitalSign(id: number, body: VitalSignValuesRequest) {
  return request<VitalSign>(`/api/vital-signs/${id}`, { method: "PUT", body })
}
