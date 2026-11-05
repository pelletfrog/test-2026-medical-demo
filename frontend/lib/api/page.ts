// 對應後端的 PageResponse，頁碼從 1 開始，見 docs/conventions.md §1.9
export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
