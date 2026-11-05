"use client"

import { createContext, useContext, useEffect, useState } from "react"

import { getMe, type Me } from "@/lib/api/auth"

const CurrentUserContext = createContext<Me | null>(null)

// 登入狀態只看 me 的回應：JWT 在 httpOnly cookie，前端讀不到；未登入時 lib/api 會導向登入頁
export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => {})
  }, [])

  return <CurrentUserContext.Provider value={me}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser() {
  return useContext(CurrentUserContext)
}
