import * as React from "react"

const MOBILE_BREAKPOINT = 768
const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// shadcn 原本在 useEffect 裡 setState，會被 react-hooks lint 擋下，也會多渲染一次。
// 螢幕寬度是瀏覽器的外部狀態，React 建議用 useSyncExternalStore 訂閱。
// 重新安裝 sidebar 會覆蓋這個檔案，屆時 lint 會再報錯，照這裡改回來即可。
function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // 伺服器端沒有螢幕寬度，先當成桌面版，和原本的行為一致
    () => false
  )
}
