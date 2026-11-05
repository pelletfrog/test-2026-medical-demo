"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { XIcon } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"

import { applyApiError } from "@/components/form/api-error"
import { FormAlert } from "@/components/form/form-alert"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createPatient } from "@/lib/api/patients"

// 規則和後端 PatientRequest 一致；病歷號轉大寫只在後端做
const schema = z.object({
  medicalRecordNo: z
    .string()
    .min(1, "請輸入病歷號")
    .max(20, "病歷號最多 20 個字")
    .regex(/^[A-Za-z0-9]*$/, "病歷號只能是英文字母與數字"),
  name: z.string().min(1, "請輸入姓名").max(50, "姓名最多 50 個字"),
})

type PatientValues = z.infer<typeof schema>

const emptyValues: PatientValues = { medicalRecordNo: "", name: "" }

export function CreatePatientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const form = useForm<PatientValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: emptyValues,
  })
  const [alert, setAlert] = useState<string | null>(null)

  // 關閉時清空：取消後再次開啟，不帶上次沒送出的內容
  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset(emptyValues)
      setAlert(null)
    }
    onOpenChange(next)
  }

  async function onSubmit(values: PatientValues) {
    setAlert(null)
    try {
      await createPatient(values)
    } catch (error) {
      setAlert(applyApiError(form, error))
      return
    }
    handleOpenChange(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 不用內建的關閉按鈕：它給螢幕閱讀器的文字是英文 */}
      <DialogContent showCloseButton={false}>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
            <DialogHeader>
              <DialogTitle>新增病患</DialogTitle>
            </DialogHeader>
            <FormAlert message={alert} />
            <TextField<PatientValues> name="medicalRecordNo" label="病歷號" maxLength={20} autoComplete="off" />
            <TextField<PatientValues> name="name" label="姓名" maxLength={50} autoComplete="off" />
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>取消</DialogClose>
              <SubmitButton>新增</SubmitButton>
            </DialogFooter>
          </form>
        </FormProvider>
        <DialogClose
          render={<Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="關閉" />}
        >
          <XIcon aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
