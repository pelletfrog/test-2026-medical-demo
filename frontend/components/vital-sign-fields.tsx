"use client"

import { useId } from "react"
import { useFormContext } from "react-hook-form"

import { ComboboxField, type ComboboxResult } from "@/components/form/combobox-field"
import { DateTimeField } from "@/components/form/date-time-field"
import { NumberField } from "@/components/form/number-field"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { PatientOption } from "@/lib/api/vital-signs"
import { nowInputDateTime } from "@/lib/date-time"
import { numberFields, patientLabel, type VitalSignFormValues } from "@/lib/vital-sign-form"

// 新增與編輯共用的欄位；編輯時病患只顯示、不能更換，見生命徵象 spec REQ-VIT-004 AC2
export function VitalSignFields({
  editing,
  searchPatients,
}: {
  editing: boolean
  searchPatients: (keyword: string) => Promise<ComboboxResult<PatientOption>>
}) {
  const { getValues } = useFormContext<VitalSignFormValues>()
  const patient = getValues("patient")
  const patientId = useId()

  return (
    <>
      {editing && patient ? (
        // 唯讀的輸入框：螢幕閱讀器會念出「病患」和值，也知道不能修改
        <Field>
          <FieldLabel htmlFor={patientId}>病患</FieldLabel>
          <Input id={patientId} readOnly value={patientLabel(patient)} className="bg-muted tabular-nums" />
        </Field>
      ) : (
        <ComboboxField<VitalSignFormValues, PatientOption>
          name="patient"
          label="病患"
          placeholder="輸入病歷號或姓名"
          search={searchPatients}
          itemKey={(p) => p.id}
          itemLabel={patientLabel}
          emptyText="找不到符合的病患"
          moreText="符合的病患超過 20 位，請輸入更多字"
        />
      )}
      <DateTimeField<VitalSignFormValues> name="measuredAt" label="記錄時間" max={nowInputDateTime()} />
      <div className="grid grid-cols-2 gap-4">
        {numberFields.map((f) => (
          <NumberField<VitalSignFormValues>
            key={f.name}
            name={f.name}
            label={f.label}
            unit={f.unit}
            decimal={f.decimals > 0}
          />
        ))}
      </div>
    </>
  )
}
