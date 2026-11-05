"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { CreatePatientDialog } from "./create-patient-dialog"
import { FormAlert } from "@/components/form/form-alert"
import { ListPagination } from "@/components/list-pagination"
import { SearchBox } from "@/components/search-box"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApiError, systemError } from "@/lib/api/client"
import type { PageResponse } from "@/lib/api/page"
import { listPatients, type Patient } from "@/lib/api/patients"

export default function PatientsPage() {
  return (
    // 不用 <main>：側邊欄版型的 SidebarInset 已經是 <main>，一頁只能有一個
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">病患列表</h1>
      {/* useSearchParams 要包在 Suspense 裡，production build 才不會失敗 */}
      <Suspense>
        <PatientList />
      </Suspense>
    </div>
  )
}

// 搜尋條件與頁碼放在網址，見 docs/conventions.md §2.6
function listUrl(pathname: string, keyword: string, page: number) {
  const params = new URLSearchParams()
  if (keyword) params.set("q", keyword)
  if (page > 1) params.set("page", String(page))
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

function PatientList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const keyword = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const [result, setResult] = useState<PageResponse<Patient> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  // 新增後網址可能沒變（本來就在第 1 頁、沒有搜尋），用這個值讓列表重新查詢
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    listPatients({ page, medicalRecordNo: keyword })
      .then((data) => {
        if (ignore) return
        // 網址的頁碼超過最後一頁時（例如手動改網址），改成顯示最後一頁
        if (data.totalPages > 0 && page > data.totalPages) {
          router.replace(listUrl(pathname, keyword, data.totalPages))
          return
        }
        setResult(data)
        setError(null)
      })
      .catch((e) => {
        if (ignore) return
        // 清掉舊的列表：不然舊資料和錯誤訊息同時出現，看不出列表是不是最新的
        setResult(null)
        setError(e instanceof ApiError ? e.detail : systemError)
      })
    // 換頁或搜尋很快時，只採用最後一次的結果
    return () => {
      ignore = true
    }
  }, [keyword, page, pathname, router, reloadKey])

  return (
    <div className="space-y-4">
      {/* 手機上「新增病患」放在搜尋框上方、靠右 */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* key：上一頁、清除等讓網址的搜尋條件改變時，輸入框跟著更新 */}
        <SearchBox
          key={keyword}
          label="搜尋病歷號"
          placeholder="搜尋病歷號"
          maxLength={20}
          defaultValue={keyword}
          onSearch={(k) => router.push(listUrl(pathname, k, 1))}
        />
        <Button className="self-end sm:self-auto" onClick={() => setDialogOpen(true)}>
          <PlusIcon data-icon="inline-start" aria-hidden />
          新增病患
        </Button>
      </div>

      <FormAlert message={error} />

      <Card className="py-0">
        <Table aria-label="病患列表">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">病歷號</TableHead>
              <TableHead>姓名</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result?.content.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-medium tabular-nums">{p.medicalRecordNo}</TableCell>
                <TableCell>{p.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {result === null && !error && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        )}
        {result?.totalElements === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {keyword ? "找不到符合的病患" : "目前沒有病患"}
          </p>
        )}
      </Card>

      {result && (
        <ListPagination
          page={result.page}
          totalPages={result.totalPages}
          totalElements={result.totalElements}
          onPageChange={(p) => router.push(listUrl(pathname, keyword, p))}
        />
      )}

      <CreatePatientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          // 清除搜尋並回到第 1 頁，剛新增的病患在最上面
          router.push(pathname)
          setReloadKey((k) => k + 1)
        }}
      />
    </div>
  )
}
