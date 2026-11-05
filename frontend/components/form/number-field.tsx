"use client"

import { useId, type ComponentProps } from "react"
import { useFormContext, type FieldValues, type Path } from "react-hook-form"

import { FieldMessage } from "@/components/form/field-message"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"

type Props<T extends FieldValues> = {
  name: Path<T>
  label: string
  // 單位放在輸入框裡的右側，標籤保持簡短
  unit?: string
  // 有小數時手機跳出含小數點的鍵盤
  decimal?: boolean
} & Omit<ComponentProps<"input">, "name" | "id" | "type">

// 不用 type="number"：它會接受 e、+ 這類字元，滑鼠滾輪也會改到數字；表單值是字串，由 Zod 檢查與轉換
export function NumberField<T extends FieldValues>({ name, label, unit, decimal = false, ...inputProps }: Props<T>) {
  const { register, getFieldState, formState } = useFormContext<T>()
  const { error } = getFieldState(name, formState)
  const id = useId()
  const errorId = `${id}-error`

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          inputMode={decimal ? "decimal" : "numeric"}
          autoComplete="off"
          className="tabular-nums"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          {...register(name, { setValueAs: (v) => (typeof v === "string" ? v.trim() : v) })}
        />
        {unit && (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{unit}</InputGroupText>
          </InputGroupAddon>
        )}
      </InputGroup>
      <FieldMessage id={errorId} message={error?.message} />
    </Field>
  )
}
