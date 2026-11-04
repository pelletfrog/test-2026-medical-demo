import type { ComponentProps } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// shadcn 的 destructive 是「橘字配淡橘底」，換成品牌橘色後對比只有 2.3:1。
// 不直接改 components/ui/button.tsx，是因為重新安裝或升級 shadcn 時會被覆蓋而沒人發現；
// 包在這裡，危險樣式的規則就不受升級影響。
export function DangerButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      variant="destructive"
      className={cn(
        "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        className
      )}
      {...props}
    />
  )
}
