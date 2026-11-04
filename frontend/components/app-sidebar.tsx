"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HeartPulseIcon } from "lucide-react"

import { findNavItem, navItems } from "@/components/nav-items"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

// 結構參考 shadcn 的 sidebar-07 block，只留這個系統用得到的部分
export function AppSidebar() {
  const pathname = usePathname()
  const active = findNavItem(pathname)
  const { isMobile, setOpenMobile } = useSidebar()

  // 手機上選單是蓋在頁面上的抽屜，點完不收起來就會擋住剛打開的頁面
  function closeOnMobile() {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/patients" onClick={closeOnMobile} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HeartPulseIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">Vitals</span>
                <span className="truncate text-xs text-muted-foreground">
                  生命徵象紀錄
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={active?.href === item.href}
                  render={<Link href={item.href} onClick={closeOnMobile} />}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
