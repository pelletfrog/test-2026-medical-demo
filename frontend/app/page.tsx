import { redirect } from "next/navigation"

// 首頁沒有自己的內容，直接帶到主要的工作畫面
export default function Home() {
  redirect("/patients")
}
