import { describe, expect, test } from "vitest"

import { nowInputDateTime, toApiDateTime, toInputDateTime } from "@/lib/date-time"

describe("conventions §1.8 API 時間格式：日期時間欄位", () => {
  test("conventions §1.8 API 時間格式：日期時間欄位與 API 互轉", () => {
    expect(toInputDateTime("2026-11-05 08:30")).toBe("2026-11-05T08:30")
    expect(toApiDateTime("2026-11-05T08:30")).toBe("2026-11-05 08:30")
  })

  test("conventions §1.8 API 時間格式：現在時間用台灣時區，不看電腦的時區設定", () => {
    // UTC 2026-11-04 23:05 是台灣 2026-11-05 07:05
    expect(nowInputDateTime(new Date("2026-11-04T23:05:30Z"))).toBe("2026-11-05T07:05")
    // 午夜要是 00，不是 24
    expect(nowInputDateTime(new Date("2026-11-04T16:00:00Z"))).toBe("2026-11-05T00:00")
  })
})
