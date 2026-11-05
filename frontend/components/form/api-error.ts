import type { FieldValues, Path, UseFormReturn } from "react-hook-form"

import { ApiError, systemError } from "@/lib/api/client"

// 把後端的錯誤放到對應欄位下方，回傳要顯示在 FormAlert 的訊息，規則見 docs/conventions.md §2.3
export function applyApiError<T extends FieldValues>(form: UseFormReturn<T>, error: unknown): string {
  if (!(error instanceof ApiError)) return systemError
  for (const [field, message] of Object.entries(error.errors)) {
    form.setError(field as Path<T>, { type: "server", message })
  }
  return error.detail
}
