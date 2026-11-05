"use client"

import { useId, type ComponentProps } from "react"
import { useFormContext, type FieldValues, type Path } from "react-hook-form"

import { FieldMessage } from "@/components/form/field-message"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props<T extends FieldValues> = {
  name: Path<T>
  label: string
} & Omit<ComponentProps<"input">, "name" | "id" | "type">

// 用瀏覽器內建的日期時間選擇器：手機上也有原生的選擇介面；只到分鐘
// 表單值是 yyyy-MM-ddTHH:mm，送出前由 lib/date-time.ts 轉成 API 的格式
export function DateTimeField<T extends FieldValues>({ name, label, ...inputProps }: Props<T>) {
  const { register, getFieldState, formState } = useFormContext<T>()
  const { error } = getFieldState(name, formState)
  const id = useId()
  const errorId = `${id}-error`

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="datetime-local"
        step={60}
        className="tabular-nums"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
        {...register(name)}
      />
      <FieldMessage id={errorId} message={error?.message} />
    </Field>
  )
}
