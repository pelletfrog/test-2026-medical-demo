import { z } from "zod"

import type { PatientOption, VitalSign, VitalSignValuesRequest } from "@/lib/api/vital-signs"
import { nowInputDateTime, toApiDateTime, toInputDateTime } from "@/lib/date-time"

// 新增／編輯紀錄的表單規則，和後端 VitalSignCreateRequest 一致；生命徵象頁與 /design-system 的示範共用
// 只檢查必填、格式、不能是負數與位數上限，不檢查醫學上的合理範圍，見生命徵象 spec §5

export const numberFields = [
  { name: "bodyTemperature", label: "體溫", unit: "°C", max: 999.9, decimals: 1 },
  { name: "heartRate", label: "心跳", unit: "次/分", max: 999, decimals: 0 },
  { name: "respiratoryRate", label: "呼吸", unit: "次/分", max: 999, decimals: 0 },
  { name: "oxygenSaturation", label: "血氧", unit: "%", max: 999, decimals: 0 },
  { name: "systolicPressure", label: "收縮壓", unit: "mmHg", max: 999, decimals: 0 },
  { name: "diastolicPressure", label: "舒張壓", unit: "mmHg", max: 999, decimals: 0 },
] as const

type NumberFieldName = (typeof numberFields)[number]["name"]

// 訊息的優先順序和後端相同：必填 → 範圍 → 格式；不是數字時後端收不到，只在這裡檢查
function numberField({ label, max, decimals }: (typeof numberFields)[number]) {
  const formatMessage = decimals === 0 ? `${label}只能是整數` : `${label}最多 ${decimals} 位小數`
  return z.string().superRefine((value, ctx) => {
    if (value === "") return ctx.addIssue({ code: "custom", message: `請輸入${label}` })
    if (!/^-?\d+(\.\d+)?$/.test(value)) return ctx.addIssue({ code: "custom", message: `${label}只能是數字` })
    const n = Number(value)
    if (n < 0 || n > max) return ctx.addIssue({ code: "custom", message: `${label}需介於 0～${max}` })
    const fraction = (value.split(".")[1] ?? "").replace(/0+$/, "")
    if (fraction.length > decimals) ctx.addIssue({ code: "custom", message: formatMessage })
  })
}

const patientSchema = z.object({ id: z.number(), medicalRecordNo: z.string(), name: z.string() })

export const vitalSignSchema = z.object({
  patient: patientSchema.nullable().refine((p) => p !== null, "請選擇病患"),
  measuredAt: z
    .string()
    .min(1, "請輸入記錄時間")
    // 兩邊都是 yyyy-MM-ddTHH:mm，可以直接比字串
    .refine((v) => v <= nowInputDateTime(), "記錄時間不能晚於現在"),
  ...(Object.fromEntries(numberFields.map((f) => [f.name, numberField(f)])) as Record<
    NumberFieldName,
    ReturnType<typeof numberField>
  >),
})

export type VitalSignFormValues = z.input<typeof vitalSignSchema>

export function emptyVitalSignForm(): VitalSignFormValues {
  return {
    patient: null,
    measuredAt: nowInputDateTime(),
    bodyTemperature: "",
    heartRate: "",
    respiratoryRate: "",
    systolicPressure: "",
    diastolicPressure: "",
    oxygenSaturation: "",
  }
}

export function toVitalSignForm(v: VitalSign): VitalSignFormValues {
  return {
    patient: { id: v.patientId, medicalRecordNo: v.medicalRecordNo, name: v.name },
    measuredAt: toInputDateTime(v.measuredAt),
    bodyTemperature: String(v.bodyTemperature),
    heartRate: String(v.heartRate),
    respiratoryRate: String(v.respiratoryRate),
    systolicPressure: String(v.systolicPressure),
    diastolicPressure: String(v.diastolicPressure),
    oxygenSaturation: String(v.oxygenSaturation),
  }
}

export function toVitalSignRequest(values: VitalSignFormValues): VitalSignValuesRequest {
  return {
    measuredAt: toApiDateTime(values.measuredAt),
    bodyTemperature: Number(values.bodyTemperature),
    heartRate: Number(values.heartRate),
    respiratoryRate: Number(values.respiratoryRate),
    systolicPressure: Number(values.systolicPressure),
    diastolicPressure: Number(values.diastolicPressure),
    oxygenSaturation: Number(values.oxygenSaturation),
  }
}

export function patientLabel(p: PatientOption) {
  return `${p.medicalRecordNo}　${p.name}`
}
