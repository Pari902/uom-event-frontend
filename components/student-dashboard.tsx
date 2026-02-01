'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  LayoutDashboard,
  Ticket,
  User,
  Search,
  Filter,
  X,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  MapPin,
  Users,
  Tag,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { mockEvents, mockRegistrations } from '@/lib/mock-data'
import type { Event, Registration, RegistrationStatus } from '@/lib/types'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/student/my-events', icon: Ticket },
  { label: 'My Attendance', href: '/dashboard/student/attendance', icon: Calendar },
  { label: 'Profile', href: '/dashboard/student/profile', icon: User },
]

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  entertainment: 'bg-pink-100 text-pink-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-amber-100 text-amber-700',
  technical: 'bg-cyan-100 text-cyan-700',
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showReuploadModal, setShowReuploadModal] = useState(false)
  
  // Registration state
  const [registrations, setRegistrations] = useState<Registration[]>(mockRegistrations)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [transactionRef, setTransactionRef] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const approvedEvents = useMemo(() => {
    return mockEvents.filter((event) => event.status === 'approved')
  }, [])

  const filteredEvents = useMemo(() => {
    return approvedEvents.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'free' && event.isFree) ||
        (priceFilter === 'paid' && !event.isFree)
      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [approvedEvents, searchQuery, categoryFilter, priceFilter])

  const getRegistrationStatus = (eventId: string): RegistrationStatus | null => {
    const reg = registrations.find((r) => r.eventId === eventId && r.studentId === user?.id)
    return reg?.status || null
  }

  const getRegistration = (eventId: string): Registration | undefined => {
    return registrations.find((r) => r.eventId === eventId && r.studentId === user?.id)
  }

  const handleRegisterClick = (event: Event) => {
    setSelectedEvent(event)
    setShowRegistrationModal(true)
    setUploadedFile(null)
    setTransactionRef('')
  }

  const handleConfirmRegistration = async () => {
    if (!selectedEvent || !user) return
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const newRegistration: Registration = {
      id: `reg-${Date.now()}`,
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      studentId: user.id,
      studentName: user.name,
      indexNumber: user.indexNumber || '',
      status: selectedEvent.isFree ? 'registered' : 'pending_payment',
      qrCode: selectedEvent.isFree ? `QR-${selectedEvent.id}-${user.indexNumber}-${Date.now()}` : undefined,
      paymentSlipUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : undefined,
      transactionRef: transactionRef || undefined,
      registeredAt: new Date().toISOString().split('T')[0],
    }
    
    setRegistrations([...registrations, newRegistration])
    setShowRegistrationModal(false)
    setIsSubmitting(false)
  }

  const handleViewQR = (event: Event) => {
    setSelectedEvent(event)
    setShowQRModal(true)
  }

  const handleReupload = (event: Event) => {
    setSelectedEvent(event)
    setShowReuploadModal(true)
    setUploadedFile(null)
    setTransactionRef('')
  }

  const handleResubmit = async () => {
    if (!selectedEvent || !user) return
    setIsSubmitting(true)
    
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    setRegistrations(
      registrations.map((reg) =>
        reg.eventId === selectedEvent.id && reg.studentId === user.id
          ? {
              ...reg,
              status: 'pending_payment' as RegistrationStatus,
              paymentSlipUrl: uploadedFile ? URL.createObjectURL(uploadedFile) : reg.paymentSlipUrl,
              transactionRef: transactionRef || reg.transactionRef,
              rejectionReason: undefined,
            }
          : reg
      )
    )
    
    setShowReuploadModal(false)
    setIsSubmitting(false)
  }

  const renderEventButton = (event: Event) => {
    const status = getRegistrationStatus(event.id)
    const isFull = event.registeredCount >= event.capacity

    if (isFull && !status) {
      return (
        <Button disabled className="w-full bg-muted text-muted-foreground">
          Event Full
        </Button>
      )
    }

    if (!status) {
      return (
        <Button onClick={() => handleRegisterClick(event)} className="w-full">
          Register Now
        </Button>
      )
    }

    switch (status) {
      case 'registered':
        return (
          <Button
            onClick={() => handleViewQR(event)}
            className="w-full bg-success text-success-foreground hover:bg-success/90"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Registered - View QR
          </Button>
        )
      case 'pending_payment':
        return (
          <Button disabled className="w-full bg-warning text-warning-foreground">
            <Clock className="mr-2 h-4 w-4" />
            Pending Verification
          </Button>
        )
      case 'payment_rejected':
        return (
          <Button
            onClick={() => handleReupload(event)}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Payment Rejected - Re-upload
          </Button>
        )
      default:
        return null
    }
  }

  const upcomingRegistrations = registrations.filter(
    (r) => r.studentId === user?.id && r.status === 'registered'
  ).length

  return (
    <DashboardLayout navItems={navItems} title="Student Dashboard">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Discover and register for upcoming events at University of Moratuwa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Events</p>
                <p className="text-2xl font-bold text-foreground">{approvedEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Registrations</p>
                <p className="text-2xl font-bold text-foreground">{upcomingRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">
                  {registrations.filter((r) => r.studentId === user?.id && r.status === 'pending_payment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Ticket className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Events Attended</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="text-sm">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Price</Label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="All Prices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter('all')
                    setPriceFilter('all')
                    setSearchQuery('')
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Available Events ({filteredEvents.length})
        </h2>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    categoryColors[event.category] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {event.category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    event.isFree
                      ? 'bg-success/10 text-success'
                      : 'bg-accent/10 text-accent-foreground'
                  }`}
                >
                  {event.isFree ? 'Free' : `Rs. ${event.price.toLocaleString()}`}
                </span>
              </div>
              <CardTitle className="mt-2 text-lg text-foreground">{event.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                {event.description}
              </p>
              <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{event.registeredCount} / {event.capacity} registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>{event.department}</span>
                </div>
              </div>
              {renderEventButton(event)}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </Card>
      )}

      {/* Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event Registration</DialogTitle>
            <DialogDescription>
              {selectedEvent?.isFree
                ? 'Confirm your registration for this free event'
                : 'Upload your bank deposit slip to complete registration'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Summary */}
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-semibold text-foreground">{selectedEvent.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>Date: {new Date(selectedEvent.date).toLocaleDateString()}</p>
                  <p>Time: {selectedEvent.time}</p>
                  <p>Venue: {selectedEvent.venue}</p>
                  {!selectedEvent.isFree && (
                    <p className="font-semibold text-foreground">
                      Amount: Rs. {selectedEvent.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Student Info */}
              <div className="rounded-lg border border-border p-4">
                <h4 className="mb-2 text-sm font-medium text-foreground">Student Information</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Name: {user?.name}</p>
                  <p>Index No: {user?.indexNumber}</p>
                  <p>Department: {user?.department}</p>
                </div>
              </div>

              {/* Paid Event - Bank Details & Upload */}
              {!selectedEvent.isFree && (
                <>
                  <div className="rounded-lg bg-primary/5 p-4">
                    <h4 className="mb-2 text-sm font-medium text-foreground">Bank Deposit Instructions</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Bank: Bank of Ceylon</p>
                      <p>Account No: 1234567890</p>
                      <p>Account Name: University of Moratuwa Events</p>
                      <p className="font-semibold text-foreground">
                        Amount: Rs. {selectedEvent.price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="slip-upload" className="text-sm">
                      Upload Bank Deposit Slip
                    </Label>
                    <div className="mt-1.5">
                      <label
                        htmlFor="slip-upload"
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
                      >
                        {uploadedFile ? (
                          <div className="text-center">
                            <CheckCircle className="mx-auto h-8 w-8 text-success" />
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click to change file
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm font-medium text-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG or PDF (max 5MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="slip-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="transaction-ref" className="text-sm">
                      Transaction Reference (Optional)
                    </Label>
                    <Input
                      id="transaction-ref"
                      placeholder="Enter transaction reference"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowRegistrationModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmRegistration}
                  disabled={isSubmitting || (!selectedEvent.isFree && !uploadedFile)}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : selectedEvent.isFree
                    ? 'Confirm Registration'
                    : 'Submit Registration'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Your Event Ticket</DialogTitle>
            <DialogDescription>
              Show this QR code at the entrance
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg bg-white p-4">
                {/* QR Code Placeholder - In production, use a QR code library */}
                <div className="flex h-full w-full flex-col items-center justify-center rounded border-4 border-foreground">
                  <div className="grid h-32 w-32 grid-cols-8 grid-rows-8 gap-0.5">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div
                        key={i}
                        className={`${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-mono text-foreground">
                    {getRegistration(selectedEvent.id)?.qrCode}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{selectedEvent.name}</p>
                <p>{new Date(selectedEvent.date).toLocaleDateString()} | {selectedEvent.time}</p>
                <p>{user?.name} ({user?.indexNumber})</p>
              </div>

              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Re-upload Modal */}
      <Dialog open={showReuploadModal} onOpenChange={setShowReuploadModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Re-upload Payment Slip</DialogTitle>
            <DialogDescription>
              Your previous payment was rejected. Please upload a new slip.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Rejection Reason */}
              <div className="rounded-lg bg-destructive/10 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                    <p className="text-sm text-destructive/80">
                      {getRegistration(selectedEvent.id)?.rejectionReason ||
                        'Payment slip could not be verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="slip-reupload" className="text-sm">
                  Upload New Bank Deposit Slip
                </Label>
                <div className="mt-1.5">
                  <label
                    htmlFor="slip-reupload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
                  >
                    {uploadedFile ? (
                      <div className="text-center">
                        <CheckCircle className="mx-auto h-8 w-8 text-success" />
                        <p className="mt-2 text-sm font-medium text-foreground">
                          {uploadedFile.name}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm font-medium text-foreground">
                          Click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or PDF (max 5MB)
                        </p>
                      </div>
                    )}
                    <input
                      id="slip-reupload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="transaction-ref-reupload" className="text-sm">
                  Transaction Reference (Optional)
                </Label>
                <Input
                  id="transaction-ref-reupload"
                  placeholder="Enter transaction reference"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowReuploadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleResubmit}
                  disabled={isSubmitting || !uploadedFile}
                >
                  {isSubmitting ? 'Submitting...' : 'Re-submit'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
