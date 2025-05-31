import type { Client } from "@/types"

const AUTH_KEY = "pipeelo_auth"

export const setAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_KEY, token)
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_KEY)
}

export const clearAuth = (): void => {
  localStorage.removeItem(AUTH_KEY)
}

// Remove the client-related functions as they're now in database.ts
