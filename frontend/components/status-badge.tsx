import {
  CircleCheckIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type VitalStatus = "normal" | "warning" | "abnormal"

// 不用 shadcn Badge 的 destructive：它是「橘字配淡橘底」，對比不足（見 docs/conventions.md 的「配色」）。
// 一律「底色 + 圖示 + 文字」，色弱的人只看圖示和文字也分得出狀態。
const styles: Record<
  VitalStatus,
  { label: string; className: string; Icon: typeof CircleCheckIcon }
> = {
  normal: {
    label: "正常",
    className: "bg-success text-success-foreground",
    Icon: CircleCheckIcon,
  },
  warning: {
    label: "注意",
    className: "bg-warning text-warning-foreground",
    Icon: TriangleAlertIcon,
  },
  abnormal: {
    label: "異常",
    className: "bg-destructive text-destructive-foreground",
    Icon: OctagonAlertIcon,
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: VitalStatus
  className?: string
}) {
  const { label, className: tone, Icon } = styles[status]
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap",
        tone,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
