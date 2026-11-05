"use client"

import { PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { VitalSign } from "@/lib/api/vital-signs"

// 寬螢幕用表格；手機欄位放不下，改成一筆一張卡片，避免左右捲動
export function VitalSignList({
  records,
  emptyText,
  onEdit,
}: {
  records: VitalSign[]
  emptyText: string
  onEdit: (record: VitalSign) => void
}) {
  return (
    <>
      <Card className="hidden py-0 md:block">
        <Table aria-label="生命徵象紀錄">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">病歷號</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>記錄時間</TableHead>
              <TableHead className="text-right">體溫</TableHead>
              <TableHead className="text-right">心跳</TableHead>
              <TableHead className="text-right">呼吸</TableHead>
              <TableHead className="text-right">血壓</TableHead>
              <TableHead className="text-right">血氧</TableHead>
              <TableHead className="pr-4 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="pl-4 font-medium tabular-nums">{r.medicalRecordNo}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell className="tabular-nums">{r.measuredAt}</TableCell>
                <TableCell className="text-right tabular-nums">{r.bodyTemperature.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.heartRate}</TableCell>
                <TableCell className="text-right tabular-nums">{r.respiratoryRate}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.systolicPressure}/{r.diastolicPressure}
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.oxygenSaturation}</TableCell>
                <TableCell className="pr-4 text-right">
                  <EditButton record={r} onEdit={onEdit} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {records.length === 0 && <Empty text={emptyText} />}
      </Card>

      <ul className="space-y-3 md:hidden" aria-label="生命徵象紀錄">
        {records.map((r) => (
          <li key={r.id}>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="tabular-nums">
                  {r.medicalRecordNo}　{r.name}
                </CardTitle>
                <CardDescription className="tabular-nums">{r.measuredAt}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Value label="體溫" value={`${r.bodyTemperature.toFixed(1)} °C`} />
                  <Value label="心跳" value={`${r.heartRate} 次/分`} />
                  <Value label="呼吸" value={`${r.respiratoryRate} 次/分`} />
                  <Value label="血氧" value={`${r.oxygenSaturation} %`} />
                  <Value label="血壓" value={`${r.systolicPressure}/${r.diastolicPressure} mmHg`} />
                </dl>
                <div className="flex justify-end">
                  <EditButton record={r} onEdit={onEdit} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
        {records.length === 0 && (
          <li>
            <Card>
              <Empty text={emptyText} />
            </Card>
          </li>
        )}
      </ul>
    </>
  )
}

function EditButton({ record, onEdit }: { record: VitalSign; onEdit: (record: VitalSign) => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={`編輯 ${record.medicalRecordNo} ${record.measuredAt} 的紀錄`}
      onClick={() => onEdit(record)}
    >
      <PencilIcon data-icon="inline-start" aria-hidden />
      編輯
    </Button>
  )
}

function Value({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="p-8 text-center text-sm text-muted-foreground">{text}</p>
}
