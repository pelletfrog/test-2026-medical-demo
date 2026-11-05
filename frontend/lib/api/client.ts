// 對應後端的 ProblemDetail，格式見 docs/conventions.md §1.4
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly errors: Record<string, string> = {}
  ) {
    super(detail)
  }
}

export const systemError = "系統發生錯誤，請稍後再試"
const networkError = "無法連線到伺服器，請稍後再試"

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: unknown
  // 登入 API 的 401 是帳號或密碼錯誤，要留在登入頁顯示 detail
  redirectOnUnauthorized?: boolean
}

export async function request<T>(
  path: string,
  { method = "GET", body, redirectOnUnauthorized = true }: RequestOptions = {}
): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, networkError)
  }

  if (res.ok) {
    // 登出等沒有內容的回應
    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return undefined as T
    }
    return (await res.json()) as T
  }

  if (res.status === 401 && redirectOnUnauthorized) {
    redirectToLogin()
  }

  // 後端沒回應時，轉發會回 502 之類不是 ProblemDetail 的內容
  const problem = await res.json().catch(() => null)
  throw new ApiError(
    res.status,
    typeof problem?.detail === "string" ? problem.detail : systemError,
    problem?.errors ?? {}
  )
}

function redirectToLogin() {
  const current = window.location.pathname + window.location.search
  // 用整頁跳轉而不是 router：登入失效後可能換另一個人登入，整頁重新載入才會清掉記憶體裡上一個人的資料；
  // 也不需要拿到 router，任何地方呼叫 API 都能用
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?redirect=${encodeURIComponent(current)}`)
}
