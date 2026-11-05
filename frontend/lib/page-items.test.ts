import { describe, expect, test } from "vitest"

import { pageItems } from "@/lib/page-items"

describe("分頁的頁碼", () => {
  test("頁數少時全部列出", () => {
    expect(pageItems(1, 1)).toEqual([1])
    expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test("頁數多時保留第一頁、最後一頁和目前頁的前後一頁，其他用省略", () => {
    expect(pageItems(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10])
  })

  test("目前頁靠近開頭或結尾時，只在另一邊省略", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
    expect(pageItems(4, 10)).toEqual([1, 2, 3, 4, 5, "ellipsis", 10])
    expect(pageItems(10, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
    expect(pageItems(7, 10)).toEqual([1, "ellipsis", 6, 7, 8, 9, 10])
  })

  test("沒有資料時不顯示頁碼", () => {
    expect(pageItems(1, 0)).toEqual([])
  })
})
