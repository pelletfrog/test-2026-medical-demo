import { PaletteIcon, UsersIcon } from "lucide-react"

// 側邊選單與頂部標題共用同一份清單，新增頁面時只改這裡
export const navItems = [
  { title: "病患列表", href: "/patients", icon: UsersIcon },
  { title: "Design System", href: "/design-system", icon: PaletteIcon },
]

export function findNavItem(pathname: string) {
  return navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}
