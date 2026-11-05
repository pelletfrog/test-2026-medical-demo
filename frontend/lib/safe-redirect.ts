const fallback = "/patients"

// redirect 參數來自網址，任何人都能改；不檢查就可能在登入後被帶到假冒的網站
export function safeRedirect(url: string | null): string {
  // 「//host」「/\host」瀏覽器會當成其他網站
  if (!url || !url.startsWith("/") || url[1] === "/" || url[1] === "\\") {
    return fallback
  }
  // 瀏覽器解析網址時會去掉 tab、換行，「/\t/host」也會變成其他網站，所以再用 URL 解析一次確認
  const base = "http://localhost"
  const parsed = new URL(url, base)
  if (parsed.origin !== base) return fallback
  return parsed.pathname + parsed.search + parsed.hash
}
