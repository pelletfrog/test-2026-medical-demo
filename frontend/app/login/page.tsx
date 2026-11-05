"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { HeartPulseIcon } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"

import { applyApiError } from "@/components/form/api-error"
import { FormAlert } from "@/components/form/form-alert"
import { PasswordField } from "@/components/form/password-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Card, CardContent } from "@/components/ui/card"
import { getMe, login } from "@/lib/api/auth"
import { safeRedirect } from "@/lib/safe-redirect"

// 字數上限和後端 LoginRequest 一致
const schema = z.object({
  username: z.string().min(1, "請輸入帳號").max(50, "帳號最多 50 個字"),
  // 密碼不去掉前後空白，但只有空白時後端會當成沒填，這裡也一樣
  password: z
    .string()
    .max(64, "密碼最多 64 個字")
    .refine((v) => v.trim() !== "", "請輸入密碼"),
})

type LoginValues = z.infer<typeof schema>

// 版型參考 shadcn login-03，不含社群登入與註冊
export default function LoginPage() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { username: "", password: "" },
  })
  const [alert, setAlert] = useState<string | null>(null)

  // 已登入的人不用再登入
  useEffect(() => {
    getMe({ redirectOnUnauthorized: false })
      .then(() => router.replace("/patients"))
      .catch(() => {})
  }, [router])

  async function onSubmit(values: LoginValues) {
    setAlert(null)
    try {
      await login(values)
    } catch (error) {
      setAlert(applyApiError(form, error))
      form.setValue("password", "")
      form.setFocus("password")
      return
    }
    // 送出時才讀網址：不用 useSearchParams，登入頁不用多包一層 Suspense
    const redirect = new URLSearchParams(window.location.search).get("redirect")
    router.replace(safeRedirect(redirect))
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulseIcon className="size-5" aria-hidden />
          </div>
          <h1 className="text-xl font-semibold">Vitals</h1>
          <p className="text-sm text-muted-foreground">病患生命徵象紀錄系統</p>
        </div>
        <Card>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-5">
                <FormAlert message={alert} />
                <TextField<LoginValues>
                  name="username"
                  label="帳號"
                  maxLength={50}
                  autoComplete="username"
                  autoFocus
                />
                <PasswordField<LoginValues>
                  name="password"
                  label="密碼"
                  maxLength={64}
                  autoComplete="current-password"
                />
                <SubmitButton className="w-full">登入</SubmitButton>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
