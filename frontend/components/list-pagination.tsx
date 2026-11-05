"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import { pageItems } from "@/lib/page-items"

type Props = {
  // 從 1 開始，和網址上的頁碼一致
  page: number
  totalPages: number
  totalElements: number
  onPageChange: (page: number) => void
}

// 不用 shadcn 的 PaginationLink：它是 <a>，換頁要改網址參數並重新查詢，由頁面決定怎麼換
export function ListPagination({ page, totalPages, totalElements, onPageChange }: Props) {
  if (totalElements === 0) return null

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">共 {totalElements} 筆</p>
      <Pagination aria-label="分頁" className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeftIcon data-icon="inline-start" aria-hidden />
              上一頁
            </Button>
          </PaginationItem>

          {/* 手機放不下頁碼，只顯示目前第幾頁 */}
          <PaginationItem className="px-2 text-sm tabular-nums sm:hidden">
            第 {page}／{totalPages} 頁
          </PaginationItem>
          {pageItems(page, totalPages).map((item, i) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item} className="hidden sm:block">
                <Button
                  variant={item === page ? "outline" : "ghost"}
                  size="icon"
                  className="tabular-nums"
                  aria-label={`第 ${item} 頁`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </Button>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button variant="ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              下一頁
              <ChevronRightIcon data-icon="inline-end" aria-hidden />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
