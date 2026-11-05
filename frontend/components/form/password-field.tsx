"use client"

import { useId, useState, type ComponentProps } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useFormContext, type FieldValues, type Path } from "react-hook-form"

import { FieldMessage } from "@/components/form/field-message"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props<T extends FieldValues> = {
  name: Path<T>
  label: string
} & Omit<ComponentProps<"input">, "name" | "id" | "type">

// 不去掉前後空白：空白也可能是密碼的一部分
export function PasswordField<T extends FieldValues>({ name, label, ...inputProps }: Props<T>) {
  const { register, getFieldState, formState } = useFormContext<T>()
  const { error } = getFieldState(name, formState)
  const [visible, setVisible] = useState(false)
  const id = useId()
  const errorId = `${id}-error`

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-9"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
          {...register(name)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-r-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={visible ? "隱藏密碼" : "顯示密碼"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
      <FieldMessage id={errorId} message={error?.message} />
    </Field>
  )
}
