"use client"

import type { ComponentProps } from "react"
import { Loader2Icon } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"

// 處理中停用：避免連按送出兩次
export function SubmitButton({ children, disabled, ...props }: Omit<ComponentProps<typeof Button>, "type">) {
  const { formState } = useFormContext()
  const submitting = formState.isSubmitting

  return (
    <Button type="submit" disabled={submitting || disabled} {...props}>
      {submitting && <Loader2Icon className="animate-spin" data-icon="inline-start" aria-hidden />}
      {children}
    </Button>
  )
}
