"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { getAuthToken, setAuthToken, clearAuth } from "@/lib/storage"
import { authenticateUser } from "@/lib/database"

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    setIsAuthenticated(!!token)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await authenticateUser(email, password)
  
    if (result.success) {
      const token = "mock-jwt-token"
      setAuthToken(token)
      setIsAuthenticated(true)
      return true
    }
  
    return false
  }

  const logout = () => {
    clearAuth()
    setIsAuthenticated(false)
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
