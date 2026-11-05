"use client"

import { useEffect, useId, useState } from "react"
import { useController, useFormContext, type FieldValues, type Path } from "react-hook-form"

import { FieldMessage } from "@/components/form/field-message"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldLabel } from "@/components/ui/field"

export type ComboboxResult<Item> = {
  items: Item[]
  // 符合的比列出來的多：提示使用者多輸入幾個字
  hasMore: boolean
}

type Props<T extends FieldValues, Item> = {
  name: Path<T>
  label: string
  placeholder?: string
  // 由伺服器查詢：資料可能很多，不一次全部載入到瀏覽器
  search: (keyword: string) => Promise<ComboboxResult<Item>>
  itemKey: (item: Item) => string | number
  itemLabel: (item: Item) => string
  emptyText: string
  moreText: string
}

// 邊輸入邊查詢；停止輸入 0.3 秒後才送出，不會每打一個字就查一次
const searchDelayMs = 300

export function ComboboxField<T extends FieldValues, Item>({
  name,
  label,
  placeholder,
  search,
  itemKey,
  itemLabel,
  emptyText,
  moreText,
}: Props<T, Item>) {
  const { control } = useFormContext<T>()
  const { field, fieldState } = useController({ name, control })
  const [keyword, setKeyword] = useState("")
  const [result, setResult] = useState<ComboboxResult<Item>>({ items: [], hasMore: false })
  const id = useId()
  const errorId = `${id}-error`
  const error = fieldState.error

  useEffect(() => {
    let ignore = false
    const timer = setTimeout(() => {
      search(keyword.trim())
        .then((r) => {
          if (!ignore) setResult(r)
        })
        // 查詢失敗時維持原本的選項；送出表單時會再由後端檢查
        .catch(() => {})
    }, searchDelayMs)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [keyword, search])

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Combobox
        items={result.items}
        // 由伺服器篩選，不再用輸入的字在瀏覽器裡篩一次
        filter={null}
        value={(field.value ?? null) as Item | null}
        onValueChange={(v) => field.onChange(v)}
        onInputValueChange={(value, details) => {
          // 只在使用者打字或清空時查詢：選好項目後輸入框會換成項目的文字，拿它查詢只會查不到東西
          if (["input-change", "input-clear", "clear-press"].includes(details.reason)) setKeyword(value)
        }}
        itemToStringLabel={itemLabel}
        isItemEqualToValue={(a, b) => itemKey(a) === itemKey(b)}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onBlur={field.onBlur}
        />
        <ComboboxContent>
          <ComboboxEmpty>{emptyText}</ComboboxEmpty>
          <ComboboxList>
            {(item: Item) => (
              <ComboboxItem key={itemKey(item)} value={item}>
                {itemLabel(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
          {result.hasMore && (
            <p className="border-t px-2 py-1.5 text-xs text-muted-foreground" role="status">
              {moreText}
            </p>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldMessage id={errorId} message={error?.message} />
    </Field>
  )
}
