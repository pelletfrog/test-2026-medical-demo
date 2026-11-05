"use client"

import { useId, useRef, useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  // 給螢幕閱讀器的欄位名稱，畫面上用 placeholder 提示
  label: string
  placeholder?: string
  maxLength?: number
  // 網址上已經有搜尋條件時帶入，重新整理後輸入框不會變空
  defaultValue?: string
  onSearch: (keyword: string) => void
}

// 按 Enter 或「搜尋」才查詢，不邊打字邊查
export function SearchBox({ label, placeholder, maxLength, defaultValue = "", onSearch }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [searched, setSearched] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  function search(keyword: string) {
    setSearched(keyword)
    onSearch(keyword)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const keyword = value.trim()
    setValue(keyword)
    search(keyword)
  }

  function clear() {
    setValue("")
    search("")
    inputRef.current?.focus()
  }

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:max-w-md">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          enterKeyHint="search"
          className="pl-8"
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {/* 手機上只留圖示，文字仍給螢幕閱讀器讀 */}
      <Button type="submit">
        <SearchIcon aria-hidden />
        <span className="sr-only sm:not-sr-only">搜尋</span>
      </Button>
      <Button type="button" variant="outline" disabled={value === "" && searched === ""} onClick={clear}>
        <XIcon aria-hidden />
        <span className="sr-only sm:not-sr-only">清除</span>
      </Button>
    </form>
  )
}
