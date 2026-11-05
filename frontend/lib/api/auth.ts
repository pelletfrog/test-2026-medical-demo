import { request } from "@/lib/api/client"

// 對應後端的 MeResponse
export type Me = {
  id: number
  username: string
  name: string
}

export type LoginRequest = {
  username: string
  password: string
}

export function login(body: LoginRequest) {
  return request<Me>("/api/auth/login", { method: "POST", body, redirectOnUnauthorized: false })
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" })
}

// 登入頁用來判斷是否已登入，未登入是正常情況，不導向
export function getMe({ redirectOnUnauthorized = true } = {}) {
  return request<Me>("/api/auth/me", { redirectOnUnauthorized })
}
