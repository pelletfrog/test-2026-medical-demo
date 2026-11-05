// 頁碼固定最多 7 格：頁碼列的寬度不會隨著換頁變動，按鈕不會跑位
const maxSlots = 7

export function pageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= maxSlots) return range(1, total)
  if (current <= 4) return [...range(1, 5), "ellipsis", total]
  if (current >= total - 3) return [1, "ellipsis", ...range(total - 4, total)]
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)
}
