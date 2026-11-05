import { request } from "@/lib/api/client"
import type { PageResponse } from "@/lib/api/page"

// 對應後端的 PatientResponse
export type Patient = {
  id: number
  medicalRecordNo: string
  name: string
}

export type PatientRequest = {
  medicalRecordNo: string
  name: string
}

export function listPatients({ page, medicalRecordNo }: { page: number; medicalRecordNo: string }) {
  const params = new URLSearchParams({ page: String(page) })
  if (medicalRecordNo) params.set("medicalRecordNo", medicalRecordNo)
  return request<PageResponse<Patient>>(`/api/patients?${params}`)
}

export function createPatient(body: PatientRequest) {
  return request<Patient>("/api/patients", { method: "POST", body })
}
