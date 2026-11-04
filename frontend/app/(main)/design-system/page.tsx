"use client"

import { useState } from "react"
import { CircleAlertIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { DangerButton } from "@/components/danger-button"
import { StatusBadge, type VitalStatus } from "@/components/status-badge"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

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

type Site = "oral" | "ear" | "axillary"

type VitalRecord = {
  id: number
  bed: string
  patient: string
  measuredAt: string
  site: Site
  temperature: number
  pulse: number
  respiration: number
  systolic: number
  diastolic: number
  spo2: number
  note: string
}

const siteItems: { value: Site; label: string }[] = [
  { value: "oral", label: "口溫" },
  { value: "ear", label: "耳溫" },
  { value: "axillary", label: "腋溫" },
]

const initialRecords: VitalRecord[] = [
  { id: 1, bed: "A-101", patient: "陳測試", measuredAt: "2026-11-04T08:00", site: "ear", temperature: 36.8, pulse: 78, respiration: 16, systolic: 122, diastolic: 78, spo2: 98, note: "" },
  { id: 2, bed: "A-102", patient: "林範例", measuredAt: "2026-11-04T08:15", site: "oral", temperature: 37.7, pulse: 104, respiration: 20, systolic: 145, diastolic: 92, spo2: 95, note: "主訴頭暈" },
  { id: 3, bed: "A-103", patient: "黃虛構", measuredAt: "2026-11-04T08:30", site: "axillary", temperature: 38.6, pulse: 126, respiration: 24, systolic: 88, diastolic: 56, spo2: 91, note: "已通知值班醫師" },
]

// 示範用的成人參考範圍，正式規則待 vital-signs spec 定義
function judge(r: Pick<VitalRecord, "temperature" | "pulse" | "respiration" | "systolic" | "spo2">) {
  const t: VitalStatus = r.temperature >= 38 || r.temperature < 35.5 ? "abnormal" : r.temperature > 37.5 || r.temperature < 36 ? "warning" : "normal"
  const p: VitalStatus = r.pulse > 120 || r.pulse < 50 ? "abnormal" : r.pulse > 100 || r.pulse < 60 ? "warning" : "normal"
  const rr: VitalStatus = r.respiration > 24 || r.respiration < 10 ? "abnormal" : r.respiration > 20 || r.respiration < 12 ? "warning" : "normal"
  const bp: VitalStatus = r.systolic >= 160 || r.systolic < 90 ? "abnormal" : r.systolic >= 140 ? "warning" : "normal"
  const o: VitalStatus = r.spo2 < 92 ? "abnormal" : r.spo2 < 95 ? "warning" : "normal"
  const all = [t, p, rr, bp, o]
  const overall: VitalStatus = all.includes("abnormal") ? "abnormal" : all.includes("warning") ? "warning" : "normal"
  return { temperature: t, pulse: p, respiration: rr, bp, spo2: o, overall }
}

function formatTime(iso: string) {
  return iso.replace("T", " ")
}

// ── 表單 ─────────────────────────────────────────────

type FormValues = Record<
  "patient" | "bed" | "measuredAt" | "temperature" | "pulse" | "respiration" | "systolic" | "diastolic" | "spo2" | "note",
  string
> & { site: Site }

const numericFields = [
  { name: "temperature", label: "體溫", unit: "°C", min: 30, max: 45, step: "0.1" },
  { name: "pulse", label: "脈搏", unit: "次/分", min: 20, max: 250, step: "1" },
  { name: "respiration", label: "呼吸", unit: "次/分", min: 4, max: 60, step: "1" },
  { name: "spo2", label: "血氧", unit: "%", min: 50, max: 100, step: "1" },
  { name: "systolic", label: "收縮壓", unit: "mmHg", min: 50, max: 260, step: "1" },
  { name: "diastolic", label: "舒張壓", unit: "mmHg", min: 30, max: 160, step: "1" },
] as const

const emptyForm: FormValues = {
  patient: "", bed: "", measuredAt: "2026-11-04T09:00", site: "ear",
  temperature: "", pulse: "", respiration: "", systolic: "", diastolic: "", spo2: "", note: "",
}

function toForm(r: VitalRecord): FormValues {
  return {
    patient: r.patient, bed: r.bed, measuredAt: r.measuredAt, site: r.site,
    temperature: String(r.temperature), pulse: String(r.pulse), respiration: String(r.respiration),
    systolic: String(r.systolic), diastolic: String(r.diastolic), spo2: String(r.spo2), note: r.note,
  }
}

function validate(v: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {}
  if (!v.patient.trim()) errors.patient = "請輸入病患姓名"
  if (!v.bed.trim()) errors.bed = "請輸入床號"
  for (const f of numericFields) {
    const n = Number(v[f.name])
    if (v[f.name] === "") errors[f.name] = `請輸入${f.label}`
    else if (Number.isNaN(n) || n < f.min || n > f.max) errors[f.name] = `${f.label}須介於 ${f.min}～${f.max} ${f.unit}`
  }
  if (!errors.systolic && !errors.diastolic && Number(v.systolic) <= Number(v.diastolic)) {
    errors.systolic = "收縮壓須高於舒張壓"
  }
  return errors
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  // 錯誤訊息不用橘字（對比 2.55:1），改用主文字色加圖示
  return (
    <p id={id} className="flex items-center gap-1 text-xs text-foreground">
      <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  )
}

// ── 頁面 ─────────────────────────────────────────────

export default function DesignSystemPage() {
  const [records, setRecords] = useState(initialRecords)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [confirmAbnormalOpen, setConfirmAbnormalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<VitalRecord | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setFormOpen(true)
  }

  function openEdit(r: VitalRecord) {
    setEditingId(r.id)
    setForm(toForm(r))
    setErrors({})
    setFormOpen(true)
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toRecord(v: FormValues, id: number): VitalRecord {
    return {
      id, bed: v.bed.trim(), patient: v.patient.trim(), measuredAt: v.measuredAt, site: v.site,
      temperature: Number(v.temperature), pulse: Number(v.pulse), respiration: Number(v.respiration),
      systolic: Number(v.systolic), diastolic: Number(v.diastolic), spo2: Number(v.spo2), note: v.note.trim(),
    }
  }

  function save() {
    const id = editingId ?? Math.max(0, ...records.map((r) => r.id)) + 1
    const record = toRecord(form, id)
    setRecords((rs) => (editingId ? rs.map((r) => (r.id === id ? record : r)) : [record, ...rs]))
    setConfirmAbnormalOpen(false)
    setFormOpen(false)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    // 異常值多半是量錯或病況變化，存檔前讓護理師再確認一次
    if (judge(toRecord(form, 0)).overall === "abnormal") {
      setConfirmAbnormalOpen(true)
      return
    }
    save()
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-12 px-4 py-8 sm:px-6">
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

      {/* 狀態 */}
      <Section title="狀態徽章" description="底色 + 圖示 + 文字，色弱也分得出來。">
        <div className="flex flex-wrap gap-3">
          <StatusBadge status="normal" />
          <StatusBadge status="warning" />
          <StatusBadge status="abnormal" />
        </div>
      </Section>

      {/* 表單元件 */}
      <Section title="表單元件" description="錯誤狀態的橘色外框只有 2.55:1，還沒處理，見頁尾「待決定」。">
        <Card>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="demo-input">一般輸入框</Label>
              <Input id="demo-input" placeholder="請輸入" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-invalid">錯誤狀態</Label>
              <Input id="demo-invalid" defaultValue="abc" aria-invalid aria-describedby="demo-invalid-error" />
              <FieldError id="demo-invalid-error" message="體溫須介於 30～45 °C" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-disabled">停用</Label>
              <Input id="demo-disabled" disabled defaultValue="A-101" />
            </div>
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

      {/* 列表 */}
      <Section
        title="列表：生命徵象紀錄"
        description="寬螢幕用表格；手機改成卡片，避免左右捲動。"
        action={<Button onClick={openCreate}><PlusIcon data-icon="inline-start" />新增紀錄</Button>}
      >
        {/* 寬螢幕：表格 */}
        <Card className="hidden py-0 md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">床號</TableHead>
                <TableHead>病患</TableHead>
                <TableHead>測量時間</TableHead>
                <TableHead className="text-right">體溫</TableHead>
                <TableHead className="text-right">脈搏</TableHead>
                <TableHead className="text-right">呼吸</TableHead>
                <TableHead className="text-right">血壓</TableHead>
                <TableHead className="text-right">血氧</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="pr-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="pl-4 font-medium">{r.bed}</TableCell>
                  <TableCell>{r.patient}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatTime(r.measuredAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.temperature.toFixed(1)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.pulse}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.respiration}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.systolic}/{r.diastolic}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.spo2}%</TableCell>
                  <TableCell><StatusBadge status={judge(r).overall} /></TableCell>
                  <TableCell className="pr-4">
                    <RowActions record={r} onEdit={openEdit} onDelete={setDeleteTarget} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {records.length === 0 && <EmptyState />}
        </Card>

        {/* 手機：卡片 */}
        <div className="space-y-3 md:hidden">
          {records.map((r) => {
            const s = judge(r)
            return (
              <Card key={r.id} size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {r.bed}　{r.patient}
                  </CardTitle>
                  <CardDescription className="tabular-nums">{formatTime(r.measuredAt)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusBadge status={s.overall} />
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Vital label="體溫" value={`${r.temperature.toFixed(1)} °C`} />
                    <Vital label="脈搏" value={`${r.pulse} 次/分`} />
                    <Vital label="呼吸" value={`${r.respiration} 次/分`} />
                    <Vital label="血氧" value={`${r.spo2} %`} />
                    <Vital label="血壓" value={`${r.systolic}/${r.diastolic} mmHg`} />
                  </dl>
                  <Separator />
                  <RowActions record={r} onEdit={openEdit} onDelete={setDeleteTarget} />
                </CardContent>
              </Card>
            )
          })}
          {records.length === 0 && <Card><EmptyState /></Card>}
        </div>
      </Section>

      {/* 待決定 */}
      <Section title="待決定" description="這頁看完後要一起討論的地方。">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>輸入框錯誤狀態的橘色外框（<code className="font-mono">aria-invalid:border-destructive</code>）對比 2.55:1，未達 3:1。</li>
          <li>判斷正常／注意／異常的閾值是示範用，正式規則要寫進 vital-signs spec。</li>
        </ul>
      </Section>

      {/* 新增／編輯 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <form onSubmit={submit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "編輯紀錄" : "新增紀錄"}</DialogTitle>
              <DialogDescription>數值超出參考範圍時，儲存前會再確認一次。</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField id="bed" label="床號" value={form.bed} error={errors.bed} onChange={(v) => set("bed", v)} />
              <TextField id="patient" label="病患" value={form.patient} error={errors.patient} onChange={(v) => set("patient", v)} />
              <div className="space-y-2">
                <Label htmlFor="measuredAt">測量時間</Label>
                <Input id="measuredAt" type="datetime-local" value={form.measuredAt} onChange={(e) => set("measuredAt", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site">體溫測量部位</Label>
                <Select items={siteItems} value={form.site} onValueChange={(v) => v && set("site", v as Site)}>
                  <SelectTrigger id="site" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {siteItems.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              {numericFields.map((f) => (
                <TextField
                  key={f.name}
                  id={f.name}
                  label={`${f.label}（${f.unit}）`}
                  value={form[f.name]}
                  error={errors[f.name]}
                  inputMode="decimal"
                  step={f.step}
                  onChange={(v) => set(f.name, v)}
                />
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">備註</Label>
              <Textarea id="note" value={form.note} onChange={(e) => set("note", e.target.value)} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
              <Button type="submit">儲存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 異常值確認 */}
      <AlertDialog open={confirmAbnormalOpen} onOpenChange={setConfirmAbnormalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>數值超出參考範圍</AlertDialogTitle>
            <AlertDialogDescription>請確認數值沒有輸入錯誤，並視需要通知醫師。確定要儲存嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AbnormalList form={form} />
          <AlertDialogFooter>
            <AlertDialogCancel>返回修改</AlertDialogCancel>
            <Button onClick={save}>確認儲存</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除確認 */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>刪除這筆紀錄？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && `${deleteTarget.bed} ${deleteTarget.patient}，${formatTime(deleteTarget.measuredAt)} 的紀錄。刪除後無法復原。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <DangerButton
              onClick={() => {
                setRecords((rs) => rs.filter((r) => r.id !== deleteTarget?.id))
                setDeleteTarget(null)
              }}
            >
              刪除
            </DangerButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
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

function RowActions({
  record,
  onEdit,
  onDelete,
}: {
  record: VitalRecord
  onEdit: (r: VitalRecord) => void
  onDelete: (r: VitalRecord) => void
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="sm" onClick={() => onEdit(record)}>
        <PencilIcon data-icon="inline-start" />編輯
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(record)}>
        <Trash2Icon data-icon="inline-start" />刪除
      </Button>
    </div>
  )
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyState() {
  return <p className="p-8 text-center text-sm text-muted-foreground">目前沒有紀錄</p>
}

function TextField({
  id,
  label,
  value,
  error,
  onChange,
  inputMode,
  step,
}: {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
  inputMode?: "decimal"
  step?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        inputMode={inputMode}
        type={inputMode ? "number" : "text"}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

function AbnormalList({ form }: { form: FormValues }) {
  const r = {
    temperature: Number(form.temperature), pulse: Number(form.pulse), respiration: Number(form.respiration),
    systolic: Number(form.systolic), spo2: Number(form.spo2),
  }
  const s = judge(r)
  const items = [
    { label: "體溫", value: `${r.temperature} °C`, status: s.temperature },
    { label: "脈搏", value: `${r.pulse} 次/分`, status: s.pulse },
    { label: "呼吸", value: `${r.respiration} 次/分`, status: s.respiration },
    { label: "收縮壓", value: `${r.systolic} mmHg`, status: s.bp },
    { label: "血氧", value: `${r.spo2} %`, status: s.spo2 },
  ].filter((i) => i.status !== "normal")
  return (
    <ul className="space-y-2 text-sm">
      {items.map((i) => (
        <li key={i.label} className="flex items-center justify-between gap-3">
          <span>{i.label} <span className="font-medium tabular-nums">{i.value}</span></span>
          <StatusBadge status={i.status} />
        </li>
      ))}
    </ul>
  )
}
