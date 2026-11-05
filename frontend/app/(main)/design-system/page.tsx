"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"

import { DangerButton } from "@/components/danger-button"
import { ListPagination } from "@/components/list-pagination"
import { SearchBox } from "@/components/search-box"
import { VitalSignDialog } from "@/components/vital-sign-dialog"
import { VitalSignList } from "@/components/vital-sign-list"
import { applyApiError } from "@/components/form/api-error"
import { ComboboxField } from "@/components/form/combobox-field"
import { DateTimeField } from "@/components/form/date-time-field"
import { FormAlert } from "@/components/form/form-alert"
import { NumberField } from "@/components/form/number-field"
import { PasswordField } from "@/components/form/password-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import type { PatientOption, VitalSign } from "@/lib/api/vital-signs"
import { patientLabel, toVitalSignRequest, type VitalSignFormValues } from "@/lib/vital-sign-form"

// ── 色票 ─────────────────────────────────────────────

const swatches = [
  { token: "primary", hex: "#00506e", on: "primary-foreground", ratio: "8.9" },
  { token: "secondary", hex: "#eef8f8", on: "secondary-foreground", ratio: "12.9" },
  { token: "muted", hex: "#f1f3f7", on: "muted-foreground", ratio: "4.1" },
  { token: "destructive", hex: "#ff7d39", on: "destructive-foreground", ratio: "5.5" },
  { token: "success", hex: "#83e254", on: "success-foreground", ratio: "6.5" },
  { token: "warning", hex: "#fed906", on: "warning-foreground", ratio: "7.6" },
  { token: "background", hex: "#faf9fb", on: "foreground", ratio: "10.0" },
  { token: "card", hex: "#ffffff", on: "card-foreground", ratio: "10.5" },
]

const lines = [
  { token: "border", hex: "#e1e4ed", note: "分隔線、卡片外框" },
  { token: "input", hex: "#6d758f", note: "輸入框外框" },
  { token: "ring", hex: "#00506e", note: "鍵盤 focus 外框" },
]

// ── 生命徵象（示範資料，全部虛構） ──────────────────────

// 給「還沒有共用元件的欄位」的下拉選單示範用
const siteItems = [
  { value: "oral", label: "口溫" },
  { value: "ear", label: "耳溫" },
  { value: "axillary", label: "腋溫" },
]

const demoPatientOptions: PatientOption[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  medicalRecordNo: `A${String(i + 1).padStart(3, "0")}`,
  name: ["陳測試", "林範例", "黃虛構", "張示範", "李假名"][i % 5],
}))

// 模擬後端的選擇病患 API：病歷號或姓名部分符合，最多 20 位
async function searchDemoPatients(keyword: string) {
  const k = keyword.toUpperCase()
  const matched = demoPatientOptions.filter((p) => p.medicalRecordNo.includes(k) || p.name.includes(keyword))
  return { items: matched.slice(0, 20), hasMore: matched.length > 20 }
}

const initialRecords: VitalSign[] = [
  { id: 3, patientId: 3, medicalRecordNo: "A003", name: "黃虛構", measuredAt: "2026-11-04 08:30", bodyTemperature: 38.6, heartRate: 126, respiratoryRate: 24, systolicPressure: 88, diastolicPressure: 56, oxygenSaturation: 91 },
  { id: 2, patientId: 2, medicalRecordNo: "A002", name: "林範例", measuredAt: "2026-11-04 08:15", bodyTemperature: 37.7, heartRate: 104, respiratoryRate: 20, systolicPressure: 145, diastolicPressure: 92, oxygenSaturation: 95 },
  { id: 1, patientId: 1, medicalRecordNo: "A001", name: "陳測試", measuredAt: "2026-11-04 08:00", bodyTemperature: 36.8, heartRate: 78, respiratoryRate: 16, systolicPressure: 122, diastolicPressure: 78, oxygenSaturation: 98 },
]

// ── 頁面 ─────────────────────────────────────────────

export default function DesignSystemPage() {
  const [records, setRecords] = useState(initialRecords)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VitalSign | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(record: VitalSign) {
    setEditing(record)
    setDialogOpen(true)
  }

  // 模擬後端：同一位病患同一個時間已有紀錄時，回傳和後端相同格式的錯誤
  async function save(values: VitalSignFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const patient = values.patient!
    const request = toVitalSignRequest(values)
    const duplicate = records.some(
      (r) => r.patientId === patient.id && r.measuredAt === request.measuredAt && r.id !== editing?.id
    )
    if (duplicate) {
      throw new ApiError(409, "請修正標示的欄位", { measuredAt: "這個時間已經有紀錄" })
    }
    const record: VitalSign = {
      id: editing?.id ?? Math.max(0, ...records.map((r) => r.id)) + 1,
      patientId: patient.id,
      medicalRecordNo: patient.medicalRecordNo,
      name: patient.name,
      ...request,
    }
    setRecords((rs) =>
      [...rs.filter((r) => r.id !== record.id), record].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))
    )
  }

  return (
    // 不用 <main>：側邊欄版型的 SidebarInset 已經是 <main>，一頁只能有一個
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Design System</h1>
        <p className="text-sm text-muted-foreground">
          確認配色與元件用。資料全部虛構，存在瀏覽器記憶體，重新整理就會還原。
        </p>
      </header>

      {/* 色票 */}
      <Section title="色票" description="配色定義在 app/globals.css，元件只用語意變數。數字是上方文字對該底色的對比。">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((s) => (
            <div key={s.token} className="overflow-hidden rounded-xl border bg-card">
              <div
                className="flex h-20 items-center justify-center text-sm font-medium"
                style={{ background: `var(--${s.token})`, color: `var(--${s.on})` }}
              >
                Aa 文字 {s.ratio}:1
              </div>
              <div className="space-y-0.5 p-3 text-xs">
                <p className="font-mono font-medium">{s.token}</p>
                <p className="font-mono text-muted-foreground">{s.hex}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {lines.map((l) => (
            <div key={l.token} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="size-10 shrink-0 rounded-lg border-2 bg-card" style={{ borderColor: `var(--${l.token})` }} />
              <div className="text-xs">
                <p className="font-mono font-medium">{l.token} <span className="text-muted-foreground">{l.hex}</span></p>
                <p className="text-muted-foreground">{l.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 按鈕 */}
      <Section title="按鈕" description="危險操作一律用 DangerButton，不用 variant=&quot;destructive&quot;。">
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>主要</Button>
              <Button variant="secondary">次要</Button>
              <Button variant="outline">外框</Button>
              <Button variant="ghost">無框</Button>
              <Button variant="link">連結</Button>
              <DangerButton>刪除</DangerButton>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">小</Button>
              <Button>預設</Button>
              <Button size="lg">大</Button>
              <Button size="icon" aria-label="新增"><PlusIcon /></Button>
              <Button disabled>停用</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* 表單元件 */}
      <Section
        title="表單元件"
        description="頁面只用 components/form/ 的元件。直接按「送出」看必填提示；填好再送出，會示範後端回傳的錯誤。錯誤狀態的橘色外框只有 2.55:1，還沒處理，見頁尾「待決定」。"
      >
        <FormDemo />
      </Section>

      <Section title="還沒有共用元件的欄位" description="用到時先在 components/form/ 加共用元件，再換掉這裡的範例。">
        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-select">下拉選單</Label>
              <Select items={siteItems} defaultValue="ear">
                <SelectTrigger id="demo-select" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {siteItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="demo-textarea">多行文字</Label>
              <Textarea id="demo-textarea" placeholder="備註" />
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* 搜尋與分頁 */}
      <Section
        title="搜尋與分頁"
        description="按 Enter 或「搜尋」才查詢。示範資料在前端篩選，正式頁面由後端查詢與分頁。手機上搜尋按鈕只留圖示，分頁只顯示第幾頁；請縮小視窗看。"
      >
        <SearchPagingDemo />
      </Section>

      {/* 列表 */}
      <Section
        title="列表與表單：生命徵象紀錄"
        description="寬螢幕用表格；手機改成卡片，避免左右捲動。新增時病患用可搜尋的下拉選單；編輯時病患不能更換。示範病患有 30 位，輸入「A」可以看到超過 20 位的提示。"
        action={<Button onClick={openCreate}><PlusIcon data-icon="inline-start" />新增紀錄</Button>}
      >
        <VitalSignList records={records} emptyText="目前沒有紀錄" onEdit={openEdit} />
      </Section>

      {/* 待決定 */}
      <Section title="待決定" description="這頁看完後要一起討論的地方。">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>輸入框錯誤狀態的橘色外框（<code className="font-mono">aria-invalid:border-destructive</code>）對比 2.55:1，未達 3:1。</li>
        </ul>
      </Section>

      <VitalSignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        searchPatients={searchDemoPatients}
        onSubmit={save}
      />
    </div>
  )
}

// ── 小元件 ───────────────────────────────────────────

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// ── 共用表單元件示範 ─────────────────────────────────

const demoSchema = z.object({
  bed: z.string().min(1, "請輸入床號").max(10, "床號最多 10 個字"),
  password: z.string().min(1, "請輸入密碼"),
  ward: z.string(),
  temperature: z.string().min(1, "請輸入體溫"),
  measuredAt: z.string().min(1, "請輸入記錄時間"),
  patient: z
    .object({ id: z.number(), medicalRecordNo: z.string(), name: z.string() })
    .nullable()
    .refine((p) => p !== null, "請選擇病患"),
})

type DemoValues = z.input<typeof demoSchema>

function FormDemo() {
  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { bed: "", password: "", ward: "A 病房", temperature: "", measuredAt: "", patient: null },
  })
  const [alert, setAlert] = useState<string | null>(null)

  async function onSubmit() {
    setAlert(null)
    // 假裝等後端回應，才看得到 SubmitButton 的處理中狀態
    await new Promise((resolve) => setTimeout(resolve, 800))
    const error = new ApiError(400, "請修正標示的欄位", { bed: "示範：後端回傳的欄位錯誤" })
    setAlert(applyApiError(form, error))
  }

  return (
    <Card>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormAlert message={alert} />
            </div>
            <TextField<DemoValues> name="bed" label="TextField（去掉前後空白）" maxLength={10} placeholder="A-101" />
            <PasswordField<DemoValues> name="password" label="PasswordField（可切換顯示）" />
            <NumberField<DemoValues> name="temperature" label="NumberField（單位在右側）" unit="°C" decimal />
            <DateTimeField<DemoValues> name="measuredAt" label="DateTimeField（到分鐘）" />
            <div className="sm:col-span-2">
              <ComboboxField<DemoValues, PatientOption>
                name="patient"
                label="ComboboxField（邊輸入邊查詢）"
                placeholder="輸入病歷號或姓名"
                search={searchDemoPatients}
                itemKey={(p) => p.id}
                itemLabel={patientLabel}
                emptyText="找不到符合的病患"
                moreText="符合的病患超過 20 位，請輸入更多字"
              />
            </div>
            <TextField<DemoValues> name="ward" label="停用" disabled />
            <div className="flex items-end">
              <SubmitButton>送出</SubmitButton>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}

// ── 搜尋與分頁示範（資料全部虛構） ───────────────────────

const demoNames = ["陳測試", "林範例", "黃虛構", "張示範", "李假名", "王樣本"]
const demoPatients = Array.from({ length: 57 }, (_, i) => ({
  medicalRecordNo: `A${String(i + 1).padStart(4, "0")}`,
  name: demoNames[i % demoNames.length],
}))
const demoPageSize = 20

function SearchPagingDemo() {
  const [keyword, setKeyword] = useState("")
  const [page, setPage] = useState(1)

  const matched = demoPatients.filter((p) => p.medicalRecordNo.includes(keyword.toUpperCase()))
  const totalPages = Math.ceil(matched.length / demoPageSize)
  const rows = matched.slice((page - 1) * demoPageSize, page * demoPageSize)

  return (
    <div className="space-y-4">
      <SearchBox
        label="搜尋病歷號"
        placeholder="搜尋病歷號"
        maxLength={20}
        onSearch={(k) => {
          setKeyword(k)
          setPage(1)
        }}
      />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">病歷號</TableHead>
              <TableHead>姓名</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.medicalRecordNo}>
                <TableCell className="pl-4 font-medium tabular-nums">{p.medicalRecordNo}</TableCell>
                <TableCell>{p.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">找不到符合的病患</p>}
      </Card>
      <ListPagination page={page} totalPages={totalPages} totalElements={matched.length} onPageChange={setPage} />
    </div>
  )
}
