import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertTitle } from "@/components/ui/alert"

// 不用 shadcn Alert 的 destructive：它是橘字，對比不足；destructive 只當底色，見 docs/conventions.md §2.4
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <Alert className="border-transparent bg-destructive text-destructive-foreground">
      <CircleAlertIcon aria-hidden />
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  )
}
