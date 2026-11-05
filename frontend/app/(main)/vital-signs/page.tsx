"use client"

import { Suspense, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlusIcon } from "lucide-react"

import { FormAlert } from "@/components/form/form-alert"
import { ListPagination } from "@/components/list-pagination"
import { SearchBox } from "@/components/search-box"
import { VitalSignDialog } from "@/components/vital-sign-dialog"
import { VitalSignList } from "@/components/vital-sign-list"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError, systemError } from "@/lib/api/client"
import type { PageResponse } from "@/lib/api/page"
import {
  createVitalSign,
  listVitalSigns,
  searchPatientOptions,
  updateVitalSign,
  type VitalSign,
} from "@/lib/api/vital-signs"
import { toVitalSignRequest, type VitalSignFormValues } from "@/lib/vital-sign-form"

export default function VitalSignsPage() {
  return (
    // 不用 <main>：側邊欄版型的 SidebarInset 已經是 <main>，一頁只能有一個
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">生命徵象</h1>
      {/* useSearchParams 要包在 Suspense 裡，production build 才不會失敗 */}
      <Suspense>
        <VitalSignPage />
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

// 放在元件外：每次都是同一個函式，選擇病患的欄位才不會一直重新查詢
async function searchPatients(keyword: string) {
  const result = await searchPatientOptions(keyword)
  return { items: result.content, hasMore: result.hasMore }
}

function VitalSignPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const keyword = searchParams.get("q") ?? ""
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const [result, setResult] = useState<PageResponse<VitalSign> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<VitalSign | null>(null)
  // 新增、編輯後網址可能沒變，用這個值讓列表重新查詢
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false
    listVitalSigns({ page, keyword })
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

  async function save(values: VitalSignFormValues) {
    const request = toVitalSignRequest(values)
    if (editing) {
      await updateVitalSign(editing.id, request)
    } else {
      await createVitalSign({ ...request, patientId: values.patient!.id })
      // 新增後清除搜尋並回到第 1 頁，新紀錄在最上面；編輯後停在原本的位置
      router.push(pathname)
    }
    setReloadKey((k) => k + 1)
  }

  return (
    <div className="space-y-4">
      {/* 手機上「新增紀錄」放在搜尋框上方、靠右 */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* key：上一頁、清除等讓網址的搜尋條件改變時，輸入框跟著更新 */}
        <SearchBox
          key={keyword}
          label="搜尋病歷號或姓名"
          placeholder="搜尋病歷號或姓名"
          maxLength={50}
          defaultValue={keyword}
          onSearch={(k) => router.push(listUrl(pathname, k, 1))}
        />
        <Button
          className="self-end sm:self-auto"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <PlusIcon data-icon="inline-start" aria-hidden />
          新增紀錄
        </Button>
      </div>

      <FormAlert message={error} />

      {result === null && !error ? (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : (
        <VitalSignList
          records={result?.content ?? []}
          emptyText={keyword ? "找不到符合的紀錄" : "目前沒有紀錄"}
          onEdit={(record) => {
            setEditing(record)
            setDialogOpen(true)
          }}
        />
      )}

      {result && (
        <ListPagination
          page={result.page}
          totalPages={result.totalPages}
          totalElements={result.totalElements}
          onPageChange={(p) => router.push(listUrl(pathname, keyword, p))}
        />
      )}

      <VitalSignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        searchPatients={searchPatients}
        onSubmit={save}
      />
    </div>
  )
}
