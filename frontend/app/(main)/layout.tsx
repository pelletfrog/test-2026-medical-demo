import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { CurrentUserProvider } from "@/components/current-user"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// (main) 是 route group：括號不會出現在網址，用來讓登入頁以外的頁面共用側邊選單
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <CurrentUserProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </CurrentUserProvider>
  )
}
