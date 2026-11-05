import { CircleAlertIcon } from "lucide-react"

import { FieldError } from "@/components/ui/field"

// shadcn 的 FieldError 是橘字，對比只有 2.55:1；改用主文字色加圖示，見 docs/conventions.md §2.4
export function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <FieldError id={id} className="flex items-center gap-1 text-foreground">
      <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden />
      {message}
    </FieldError>
  )
}
