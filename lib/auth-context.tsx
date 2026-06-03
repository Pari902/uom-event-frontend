'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from './types'
import { authApi } from './api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper: Map backend user_type to frontend UserRole
const mapUserType = (userType: string): UserRole => {
  switch (userType) {
    case 'Student': return 'student'
    case 'Organizer': return 'organizer'
    case 'VenueManager': return 'venue_manager'
    case 'Treasurer': return 'treasurer'
    case 'Dean': return 'dean'
    case 'ViceChancellor': return 'vice_chancellor'
    case 'Admin': return 'admin'
    default: return 'student'
  }
}

// Helper: Transform backend user to frontend User type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapUser = (data: any): User => {
  return {
    id: String(data.user_id),
    name: `${data.first_name} ${data.last_name}`,
    email: data.email as string,
    role: mapUserType(data.user_type as string),
    department: data.department_name ||
      data.studentInfo?.department_name ||
      data.organizerInfo?.department_name ||
      undefined,
    faculty: data.studentInfo?.faculty_name ||
      data.deanInfo?.faculty_name ||
      undefined,
    indexNumber: data.studentInfo?.index_number || undefined,
    status: 'active',
    organizationType: data.organizerInfo?.organization_type || undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On app load, check if token exists and fetch user
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authApi.getMe().then((res) => {
        if (res.success && res.data) {
          setUser(mapUser(res.data))
        } else {
          localStorage.removeItem('token')
        }
        setIsLoading(false)
      }).catch(() => {
        localStorage.removeItem('token')
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await authApi.login(email, password)

      if (res.success) {
        localStorage.setItem('token', res.data.token)
        
        // Fetch full profile (with organizerInfo, etc)
        const meRes = await authApi.getMe()
        if (meRes.success && meRes.data) {
          const mappedUser = mapUser(meRes.data)
          setUser(mappedUser)
          return { success: true, user: mappedUser }
        }
        
        const mappedUser = mapUser(res.data.user)
        setUser(mappedUser)
        return { success: true, user: mappedUser }
      } else {
        return { success: false, error: res.message || 'Login failed' }
      }
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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