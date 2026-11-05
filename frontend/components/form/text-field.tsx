"use client"

import { useId, type ComponentProps } from "react"
import { useFormContext, type FieldValues, type Path } from "react-hook-form"

import { FieldMessage } from "@/components/form/field-message"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props<T extends FieldValues> = {
  name: Path<T>
  label: string
} & Omit<ComponentProps<"input">, "name" | "id">

export function TextField<T extends FieldValues>({ name, label, ...inputProps }: Props<T>) {
  const { register, getFieldState, formState } = useFormContext<T>()
  const { error } = getFieldState(name, formState)
  const id = useId()
  const errorId = `${id}-error`

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
        // 在存進表單值時去掉前後空白，不改輸入框顯示的字：邊打字邊去空白會吃掉字與字之間正要輸入的空白
        {...register(name, { setValueAs: (v) => (typeof v === "string" ? v.trim() : v) })}
      />
      <FieldMessage id={errorId} message={error?.message} />
    </Field>
  )
}
