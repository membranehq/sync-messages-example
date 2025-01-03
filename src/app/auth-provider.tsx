"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { AuthUser } from "@/lib/auth"
import { ensureAuth, storeAuth } from "@/lib/auth"

interface AuthContextType {
  userId: string | null
  userName: string | null
  setUserName: (name: string) => void
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  userName: null,
  setUserName: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthUser | null>(null)

  useEffect(() => {
    // Ensure we have auth on mount
    const currentAuth = ensureAuth()
    setAuth(currentAuth)
  }, [])

  const setUserName = (name: string) => {
    if (!auth) return
    const newAuth = { ...auth, userName: name }
    storeAuth(newAuth)
    setAuth(newAuth)
  }

  return (
    <AuthContext.Provider
      value={{
        userId: auth?.userId ?? null,
        userName: auth?.userName ?? null,
        setUserName,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Helper function to get auth headers for API calls
export function getAuthHeaders(): HeadersInit {
  const auth = ensureAuth()
  return {
    "x-auth-id": auth.userId,
    "x-user-name": auth.userName || "",
  }
}
