'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  Ticket,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { Registration } from '@/lib/types'

const statusColors: Record<string, string> = {
  registered: 'bg-green-100 text-green-700',
  pending_payment: 'bg-amber-100 text-amber-700',
  payment_rejected: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  registered: 'Registered',
  pending_payment: 'Pending Payment',
  payment_rejected: 'Payment Rejected',
}

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  entertainment: 'bg-pink-100 text-pink-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-amber-100 text-amber-700',
  technical: 'bg-cyan-100 text-cyan-700',
}

export function MyEventsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)

  // Get all registrations for the current user
  const myRegistrations = useMemo(() => {
    return mockRegistrations.filter((r) => r.studentId === user?.id)
  }, [user?.id])

  // Filter to show only upcoming events
  const upcomingRegistrations = useMemo(() => {
    return myRegistrations.filter((reg) => {
      const event = mockEvents.find((e) => e.id === reg.eventId)
      if (!event) return false
      const eventDate = new Date(event.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return eventDate >= today
    })
  }, [myRegistrations])

  // Apply search and filters
  const filteredRegistrations = useMemo(() => {
    return upcomingRegistrations.filter((reg) => {
      const event = mockEvents.find((e) => e.id === reg.eventId)
      if (!event) return false

      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || reg.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [upcomingRegistrations, searchQuery, statusFilter])

  const getEventDetails = (eventId: string) => {
    return mockEvents.find((e) => e.id === eventId)
  }

  const handleViewQR = (registration: Registration) => {
    setSelectedRegistration(registration)
    setShowQRModal(true)
  }

  const generateQRCode = (code: string) => {
    // Generate a simple QR-like pattern using the code
    return (
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-foreground p-4">
          <svg width="200" height="200" viewBox="0 0 200 200" className="text-background">
            {/* QR Code pattern */}
            <rect fill="currentColor" width="200" height="200" />
            {/* Position detection patterns */}
            <rect fill="#000" x="10" y="10" width="50" height="50" />
            <rect fill="#fff" x="15" y="15" width="40" height="40" />
            <rect fill="#000" x="20" y="20" width="30" height="30" />
            
            <rect fill="#000" x="140" y="10" width="50" height="50" />
            <rect fill="#fff" x="145" y="15" width="40" height="40" />
            <rect fill="#000" x="150" y="20" width="30" height="30" />
            
            <rect fill="#000" x="10" y="140" width="50" height="50" />
            <rect fill="#fff" x="15" y="145" width="40" height="40" />
            <rect fill="#000" x="20" y="150" width="30" height="30" />
            
            {/* Data modules - simplified pattern */}
            {Array.from({ length: 10 }, (_, i) => (
              Array.from({ length: 10 }, (_, j) => {
                const hash = (code.charCodeAt(i % code.length) + j * 7) % 2
                if (hash === 0 && (i > 2 || j > 2) && (i > 2 || j < 7) && (i < 7 || j > 2)) {
                  return (
                    <rect
                      key={`${i}-${j}`}
                      fill="#000"
                      x={70 + j * 6}
                      y={70 + i * 6}
                      width="5"
                      height="5"
                    />
                  )
                }
                return null
              })
            ))}
          </svg>
        </div>
        <p className="mt-4 text-center font-mono text-sm text-muted-foreground">{code}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Upcoming Events</h1>
        <p className="text-muted-foreground">
          View all your registered upcoming events
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredRegistrations.filter((r) => r.status === 'registered').length}
                </p>
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
                <p className="text-sm text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredRegistrations.filter((r) => r.status === 'pending_payment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Action Required</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredRegistrations.filter((r) => r.status === 'payment_rejected').length}
                </p>
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
            <div className="mt-4 flex flex-wrap items-end gap-4 border-t border-border pt-4">
              <div className="min-w-[200px]">
                <label className="mb-1.5 block text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="payment_rejected">Payment Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all')
                  setSearchQuery('')
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {filteredRegistrations.length === 0 ? (
          <Card className="p-8 text-center">
            <Ticket className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">No upcoming events</p>
            <p className="text-muted-foreground">
              You have not registered for any upcoming events yet
            </p>
          </Card>
        ) : (
          filteredRegistrations.map((registration) => {
            const event = getEventDetails(registration.eventId)
            if (!event) return null

            return (
              <Card key={registration.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{event.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                            categoryColors[event.category] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {event.category}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            statusColors[registration.status]
                          }`}
                        >
                          {statusLabels[registration.status]}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Tag className="h-4 w-4" />
                          <span>{event.isFree ? 'Free' : `Rs. ${event.price.toLocaleString()}`}</span>
                        </div>
                      </div>
                      {registration.status === 'payment_rejected' && registration.rejectionReason && (
                        <div className="mt-3 rounded-lg bg-destructive/10 p-3">
                          <p className="text-sm text-destructive">
                            <strong>Rejection Reason:</strong> {registration.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {registration.status === 'registered' && registration.qrCode && (
                        <Button onClick={() => handleViewQR(registration)}>
                          <Ticket className="mr-2 h-4 w-4" />
                          View QR Code
                        </Button>
                      )}
                      {registration.status === 'pending_payment' && (
                        <Button disabled className="bg-warning text-warning-foreground">
                          <Clock className="mr-2 h-4 w-4" />
                          Awaiting Verification
                        </Button>
                      )}
                      {registration.status === 'payment_rejected' && (
                        <Button variant="destructive">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Re-upload Slip
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event QR Code</DialogTitle>
            <DialogDescription>
              Show this QR code at the event entrance for verification
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-center">
                <h3 className="font-semibold text-foreground">
                  {getEventDetails(selectedRegistration.eventId)?.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {getEventDetails(selectedRegistration.eventId)?.date} at{' '}
                  {getEventDetails(selectedRegistration.eventId)?.venue}
                </p>
              </div>

              <div className="flex justify-center py-4">
                {selectedRegistration.qrCode && generateQRCode(selectedRegistration.qrCode)}
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Index No:</span>
                    <span className="font-medium text-foreground">{user?.indexNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration ID:</span>
                    <span className="font-medium text-foreground">{selectedRegistration.id}</span>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
