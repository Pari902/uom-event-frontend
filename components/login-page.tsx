'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { loginCredentials } from '@/lib/mock-data'

const roleRoutes: Record<string, string> = {
  student: '/dashboard/student',
  organizer: '/dashboard/organizer',
  venue_manager: '/dashboard/venue-manager',
  treasurer: '/dashboard/approval',
  dean: '/dashboard/approval',
  vice_chancellor: '/dashboard/approval',
  admin: '/dashboard/admin',
}

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = login(email, password)
    
    if (result.success) {
      const role = Object.entries(loginCredentials).find(
        ([, cred]) => cred.email === email
      )?.[0]
      
      if (role && roleRoutes[role]) {
        router.push(roleRoutes[role])
      }
    } else {
      setError(result.error || 'Login failed')
    }
    
    setIsLoading(false)
  }

  const handleQuickLogin = (role: string) => {
    const creds = loginCredentials[role as keyof typeof loginCredentials]
    setEmail(creds.email)
    setPassword(creds.password)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">UoM Events</span>
              <p className="text-xs text-muted-foreground">University of Moratuwa</p>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@uom.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-foreground">Demo Accounts</CardTitle>
              <CardDescription className="text-xs">Click to auto-fill credentials</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('student')}
                className="text-xs"
              >
                Student
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('organizer')}
                className="text-xs"
              >
                Organizer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('venue_manager')}
                className="text-xs"
              >
                Venue Manager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('treasurer')}
                className="text-xs"
              >
                Treasurer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('dean')}
                className="text-xs"
              >
                Dean
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('vice_chancellor')}
                className="text-xs"
              >
                Vice Chancellor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickLogin('admin')}
                className="col-span-2 text-xs"
              >
                Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
