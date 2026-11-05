"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { XIcon } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"

import type { ComboboxResult } from "@/components/form/combobox-field"
import { applyApiError } from "@/components/form/api-error"
import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { VitalSignFields } from "@/components/vital-sign-fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PatientOption, VitalSign } from "@/lib/api/vital-signs"
import {
  emptyVitalSignForm,
  toVitalSignForm,
  vitalSignSchema,
  type VitalSignFormValues,
} from "@/lib/vital-sign-form"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 有值時是編輯那筆紀錄，沒有時是新增
  editing: VitalSign | null
  searchPatients: (keyword: string) => Promise<ComboboxResult<PatientOption>>
  // 失敗時丟出 ApiError，錯誤會顯示在對應的欄位或上方
  onSubmit: (values: VitalSignFormValues) => Promise<void>
}

export function VitalSignDialog({ open, onOpenChange, ...formProps }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 不用內建的關閉按鈕：它給螢幕閱讀器的文字是英文 */}
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        {/* 對話框關閉時內容會卸載，每次開啟都是新的表單：新增時欄位是空的、記錄時間是現在 */}
        <VitalSignForm {...formProps} onDone={() => onOpenChange(false)} />
        <DialogClose
          render={<Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="關閉" />}
        >
          <XIcon aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

function VitalSignForm({
  editing,
  searchPatients,
  onSubmit,
  onDone,
}: Omit<Props, "open" | "onOpenChange"> & { onDone: () => void }) {
  const form = useForm<VitalSignFormValues>({
    resolver: zodResolver(vitalSignSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: editing ? toVitalSignForm(editing) : emptyVitalSignForm(),
  })
  const [alert, setAlert] = useState<string | null>(null)

  async function submit(values: VitalSignFormValues) {
    setAlert(null)
    try {
      await onSubmit(values)
    } catch (error) {
      // 後端送的是病患的 id，錯誤也放在 patientId；表單上是病患欄位 patient
      setAlert(applyApiError(form, error, { patientId: "patient" }))
      return
    }
    onDone()
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-5">
        <DialogHeader>
          <DialogTitle>{editing ? "編輯紀錄" : "新增紀錄"}</DialogTitle>
        </DialogHeader>
        <FormAlert message={alert} />
        <VitalSignFields editing={editing !== null} searchPatients={searchPatients} />
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
          <SubmitButton>儲存</SubmitButton>
        </DialogFooter>
      </form>
    </FormProvider>
  )
}
