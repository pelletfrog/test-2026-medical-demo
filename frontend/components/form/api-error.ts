import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import { ApiError, systemError } from "@/lib/api/client"

// 把後端的錯誤放到對應欄位下方，回傳要顯示在 FormAlert 的訊息，規則見 docs/conventions.md §2.3
// fieldNames：後端的欄位和表單的欄位名稱不同時的對應，例如後端的 patientId 是表單的 patient
export function applyApiError<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
  fieldNames: Record<string, Path<T>> = {}
): string {
  if (!(error instanceof ApiError)) return systemError
  for (const [field, message] of Object.entries(error.errors)) {
    form.setError(fieldNames[field] ?? (field as Path<T>), { type: "server", message })
  }
  return error.detail
}
