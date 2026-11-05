"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HeartPulseIcon, LogOutIcon, UserIcon } from "lucide-react"

import { useCurrentUser } from "@/components/current-user"
import { findNavItem, navItems } from "@/components/nav-items"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { logout } from "@/lib/api/auth"

// 結構參考 shadcn 的 sidebar-07 block，只留這個系統用得到的部分
export function AppSidebar() {
  const pathname = usePathname()
  const active = findNavItem(pathname)
  const { isMobile, setOpenMobile } = useSidebar()
  const me = useCurrentUser()

  // 不跳確認視窗，直接登出
  async function handleLogout() {
    try {
      await logout()
    } catch {
      // 登出失敗時 cookie 還在，到登入頁會被帶回病患列表，使用者看得出沒有登出
    }
    // 整頁重新載入，和 lib/api 收到 401 時一樣：清掉記憶體裡這個人的資料，換人登入時看不到
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login")
  }

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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex h-8 items-center gap-2 px-2 text-sm group-data-[collapsible=icon]:hidden">
              <UserIcon className="size-4 shrink-0" aria-hidden />
              {me ? (
                <span className="truncate font-medium">{me.name}</span>
              ) : (
                <Skeleton className="h-4 w-20" />
              )}
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="登出" onClick={handleLogout}>
              <LogOutIcon />
              <span>登出</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
