// API 的時間是 yyyy-MM-dd HH:mm（台灣時間，見 docs/conventions.md §1.8）；
// <input type="datetime-local"> 的值是 yyyy-MM-ddTHH:mm，兩者只差中間的分隔字元

export function toInputDateTime(api: string): string {
  return api.replace(" ", "T")
}

export function toApiDateTime(input: string): string {
  return input.replace("T", " ")
}

// 現在的台灣時間，datetime-local 的格式；不用瀏覽器的時區：電腦的時區設定不一定是台灣
export function nowInputDateTime(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now)
  return parts.replace(" ", "T")
}
