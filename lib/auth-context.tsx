'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, UserRole } from './types'
import { mockUsers, loginCredentials } from './mock-data'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const validCredential = Object.entries(loginCredentials).find(
      ([, cred]) => cred.email === email && cred.password === password
    )

    if (validCredential) {
      const role = validCredential[0] as UserRole
      const foundUser = mockUsers.find((u) => u.email === email)
      if (foundUser) {
        setUser(foundUser)
        return { success: true }
      }
    }

    return { success: false, error: 'Invalid email or password' }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
