'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, Building2, User, Phone, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { authApi } from '@/lib/api'

// Seeded database records mapping
const FACULTIES = [
  { id: 'FIT', name: 'Faculty of Information Technology' },
  { id: 'FOE', name: 'Faculty of Engineering' },
  { id: 'FOA', name: 'Faculty of Architecture' },
]

const DEPARTMENTS = [
  { id: 1, facultyId: 'FIT', name: 'Computer Science' },
  { id: 2, facultyId: 'FIT', name: 'Information Systems' },
  { id: 3, facultyId: 'FOE', name: 'Civil Engineering' },
  { id: 4, facultyId: 'FOE', name: 'Electrical Engineering' },
]

const CLUBS = [
  "Rotaract Club of University of Moratuwa",
  "Gavel Club of University of Moratuwa",
  "IEEE Student Branch of University of Moratuwa",
  "Leo Club of University of Moratuwa",
  "Sports Council",
  "AIESEC in University of Moratuwa",
  "Other (Specify Name)"
]

export function RegisterPage() {
  const router = useRouter()
  
  // Basic Info States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Organization Info States
  const [orgCategory, setOrgCategory] = useState<string>('')
  const [selectedFaculty, setSelectedFaculty] = useState<string>('')
  const [selectedDeptId, setSelectedDeptId] = useState<string>('')
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [customClubName, setCustomClubName] = useState<string>('')

  // UI Flow & Alert States
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  // Filtered departments based on selected faculty
  const filteredDepartments = DEPARTMENTS.filter(d => d.facultyId === selectedFaculty)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic Validations
    if (!email.endsWith('@uom.lk')) {
      setError('Only University of Moratuwa email addresses are allowed (@uom.lk)')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!orgCategory) {
      setError('Please select an organization category')
      return
    }

    // Determine backend values for organizationType and departmentId
    let finalOrgType = ''
    let finalDeptId: number | null = null

    if (orgCategory === 'Faculty') {
      if (!selectedFaculty) {
        setError('Please select your faculty')
        return
      }

      const facName = FACULTIES.find(f => f.id === selectedFaculty)?.name || selectedFaculty
      finalOrgType = `Faculty - ${facName}`
      finalDeptId = (selectedDeptId && selectedDeptId !== 'none') ? parseInt(selectedDeptId, 10) : null
    } else if (orgCategory === 'Club') {
      if (!selectedClub) {
        setError('Please select or specify your organization name')
        return
      }
      
      const clubName = selectedClub === 'Other (Specify Name)' ? customClubName : selectedClub
      if (!clubName.trim()) {
        setError('Please enter your club or society name')
        return
      }

      finalOrgType = `Club - ${clubName}`
      finalDeptId = null
    }

    setIsLoading(true)

    try {
      const payload = {
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        userType: 'Organizer',
        organizationType: finalOrgType,
        departmentId: finalDeptId
      }

      const res = await authApi.register(payload)

      if (res.success) {
        setIsSuccess(true)
      } else {
        setError(res.message || 'Registration failed. Please check your inputs.')
      }
    } catch (err: unknown) {
      console.error('Registration Error:', err)
      setError('A connection error occurred. Please verify your backend server is running.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">UoM Events</span>
                <p className="text-xs text-muted-foreground">University of Moratuwa</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-border bg-card text-center p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-2xl font-bold text-foreground">Application Submitted!</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Your request to become an Event Organizer has been successfully registered.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
              <div className="rounded-lg bg-muted/50 p-4 border border-border text-sm text-left leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> What happens next?
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Your registration status is currently set to <strong className="text-amber-600 dark:text-amber-400">Pending</strong> approval.</li>
                  <li>The system administrator will review your application and organization credentials.</li>
                  <li>You will be activated once the registration is verified.</li>
                </ul>
              </div>
              <Button onClick={() => router.push('/login')} className="w-full">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
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
          <Link href="/login">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
        <Card className="w-full max-w-2xl border-border bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-foreground">Apply for Organizer Account</CardTitle>
            <CardDescription>Register as an event organizer to publish, approve, and manage campus events</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3.5 text-sm text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">1. Personal Profile</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="pl-9"
                      />
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+94 7X XXX XXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="pl-9"
                    />
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">2. Organization Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="orgCategory">Organization Category</Label>
                  <Select value={orgCategory} onValueChange={(val) => {
                    setOrgCategory(val)
                    setSelectedFaculty('')
                    setSelectedDeptId('')
                    setSelectedClub('')
                    setCustomClubName('')
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Organization Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Faculty">Faculty organization</SelectItem>
                      <SelectItem value="Club">Student Club/Society</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Faculty Select */}
                {orgCategory === 'Faculty' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="faculty">Faculty</Label>
                      <Select value={selectedFaculty} onValueChange={(val) => {
                        setSelectedFaculty(val)
                        setSelectedDeptId('')
                      }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {FACULTIES.map((fac) => (
                            <SelectItem key={fac.id} value={fac.id}>{fac.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conditional Department Select (Only shown for Faculty types) */}
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={selectedDeptId} 
                        onValueChange={setSelectedDeptId}
                        disabled={!selectedFaculty}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={selectedFaculty ? "Select Department" : "Select Faculty first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredDepartments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                          ))}
                          {selectedFaculty === 'FOA' && (
                            <SelectItem value="none">Architecture / Other</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Conditional Clubs/Societies Selection */}
                {orgCategory === 'Club' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clubSelect">Select Organization</Label>
                      <Select value={selectedClub} onValueChange={setSelectedClub}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Club/Society" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLUBS.map((club) => (
                            <SelectItem key={club} value={club}>{club}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedClub === 'Other (Specify Name)' && (
                      <div className="space-y-2">
                        <Label htmlFor="customClub">Custom Club/Society Name</Label>
                        <Input
                          id="customClub"
                          placeholder="Enter organization name"
                          value={customClubName}
                          onChange={(e) => setCustomClubName(e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Login Credentials */}
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">3. Account Credentials</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email">University Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="yourname@uom.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Must be a valid @uom.lk university email address</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-9"
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="pl-9"
                      />
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? 'Submitting Registration...' : 'Apply for Organizer Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
