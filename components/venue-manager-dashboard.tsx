'use client'

import { useState, useMemo } from 'react'
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Settings,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { mockVenueRequests, mockVenues, mockEvents } from '@/lib/mock-data'
import type { VenueRequest, Venue } from '@/lib/types'



const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export interface VenueManagerDashboardProps {
  view?: 'dashboard' | 'venues' | 'calendar' | 'settings'
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard/venue-manager', icon: LayoutDashboard },
  { label: 'Venues', href: '/dashboard/venue-manager/venues', icon: MapPin },
  { label: 'Calendar', href: '/dashboard/venue-manager/calendar', icon: Calendar },
  { label: 'Settings', href: '/dashboard/venue-manager/settings', icon: Settings },
]

export function VenueManagerDashboard({ view = 'dashboard' }: VenueManagerDashboardProps) {
  const { user } = useAuth()
  const [venueRequests, setVenueRequests] = useState<VenueRequest[]>(mockVenueRequests)
  const [venues, setVenues] = useState<Venue[]>(mockVenues)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showAddVenueModal, setShowAddVenueModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<VenueRequest | null>(null)

  // Event Details Modal state
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [selectedEventDetails, setSelectedEventDetails] = useState<{
    title: string
    type: 'event' | 'request' | 'blocked'
    date: string
    venue: string
    description?: string
    organizer?: string
    status?: string
  } | null>(null)

  const [rejectReason, setRejectReason] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Block dates form
  const [blockVenueId, setBlockVenueId] = useState('')
  const [blockStartDate, setBlockStartDate] = useState('')
  const [blockEndDate, setBlockEndDate] = useState('')
  const [blockReason, setBlockReason] = useState('')

  // Add venue form
  const [newVenue, setNewVenue] = useState({
    name: '',
    capacity: '',
    facilities: '',
  })

  const pendingRequests = useMemo(() => {
    return venueRequests.filter((r) => r.status === 'pending')
  }, [venueRequests])

  const approvedRequests = useMemo(() => {
    return venueRequests.filter((r) => r.status === 'approved')
  }, [venueRequests])

  const handleApprove = (requestId: string) => {
    setVenueRequests(
      venueRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      )
    )
  }

  const handleReject = () => {
    if (!selectedRequest || !rejectReason) return
    setVenueRequests(
      venueRequests.map((r) =>
        r.id === selectedRequest.id
          ? { ...r, status: 'rejected' as const, comment: rejectReason }
          : r
      )
    )
    setShowRejectModal(false)
    setRejectReason('')
    setSelectedRequest(null)
  }

  const openRejectModal = (request: VenueRequest) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
  }

  const handleBlockDates = () => {
    if (!blockVenueId || !blockStartDate || !blockEndDate || !blockReason) return
    setVenues(
      venues.map((v) =>
        v.id === blockVenueId
          ? {
            ...v,
            blockedDates: [
              ...v.blockedDates,
              { start: blockStartDate, end: blockEndDate, reason: blockReason },
            ],
          }
          : v
      )
    )
    setShowBlockModal(false)
    setBlockVenueId('')
    setBlockStartDate('')
    setBlockEndDate('')
    setBlockReason('')
  }

  const toggleVenueStatus = (venueId: string) => {
    setVenues(
      venues.map((v) =>
        v.id === venueId
          ? { ...v, status: v.status === 'available' ? 'maintenance' : 'available' }
          : v
      )
    )
  }

  const handleAddVenue = () => {
    const venue: Venue = {
      id: `venue-${Date.now()}`,
      name: newVenue.name,
      capacity: parseInt(newVenue.capacity) || 100,
      facilities: newVenue.facilities.split(',').map((f) => f.trim()),
      status: 'available',
      blockedDates: [],
    }
    setVenues([...venues, venue])
    setShowAddVenueModal(false)
    setNewVenue({ name: '', capacity: '', facilities: '' })
  }

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return mockEvents.filter((e) => e.date === dateStr && e.status === 'approved')
  }

  const getRequestsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return venueRequests.filter((r) => r.requestedDate === dateStr && r.status === 'pending')
  }

  const getBlockedDatesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const blocked: { venueId: string; venueName: string; reason: string }[] = []

    venues.forEach(venue => {
      venue.blockedDates.forEach(block => {
        if (dateStr >= block.start && dateStr <= block.end) {
          blocked.push({
            venueId: venue.id,
            venueName: venue.name,
            reason: block.reason
          })
        }
      })
    })
    return blocked
  }

  const handleEventClick = (item: any, type: 'event' | 'request' | 'blocked') => {
    if (type === 'event') {
      setSelectedEventDetails({
        title: item.name,
        type: 'event',
        date: item.date,
        venue: item.venue,
        description: item.description,
        organizer: item.organizer,
        status: 'Approved'
      })
    } else if (type === 'request') {
      setSelectedEventDetails({
        title: item.eventName,
        type: 'request',
        date: item.requestedDate,
        venue: item.venueName,
        description: `Request by ${item.organizerName} (${item.organizerDepartment})`,
        organizer: item.organizerName,
        status: 'Pending Approval'
      })
    } else if (type === 'blocked') {
      setSelectedEventDetails({
        title: 'Venue Blocked',
        type: 'blocked',
        date: '', // Blocked ranges are handled differently, simplify for now
        venue: item.venueName,
        description: item.reason,
        status: 'Maintenance/Blocked'
      })
    }
    setShowEventDetailsModal(true)
  }

  const calendarDays = getDaysInMonth(currentMonth)

  return (
    <DashboardLayout navItems={navItems} title="Venue Manager Dashboard">
      {/* Welcome Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">Manage venue requests and bookings</p>
        </div>
        <div className="flex gap-2">
          {/* Buttons moved to specific views */}
          {view === 'calendar' && (
            <Button variant="outline" onClick={() => setShowBlockModal(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Block Dates
            </Button>
          )}
          {view === 'venues' && (
            <Button onClick={() => setShowAddVenueModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards - Show everywhere for context? Or maybe just Dashboard? showing everywhere seems useful for context */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
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
                <p className="text-sm text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold text-foreground">{approvedRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Venues</p>
                <p className="text-2xl font-bold text-foreground">{venues.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <Wrench className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Under Maintenance</p>
                <p className="text-2xl font-bold text-foreground">
                  {venues.filter((v) => v.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Dashboard View - Only Pending Requests */}
        {view === 'dashboard' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Venue Requests</CardTitle>
              <CardDescription>Review and approve or reject venue booking requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-success" />
                  <p className="mt-4 text-lg font-medium text-foreground">All caught up!</p>
                  <p className="text-muted-foreground">No pending venue requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{request.eventName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Organizer: {request.organizerName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Department: {request.organizerDepartment}
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{request.venueName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(request.requestedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{request.requestedTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground hover:bg-success/90"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectModal(request)}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Venue Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[140px] text-center font-medium">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="p-2" />
                  }
                  const events = getEventsForDate(day)
                  const requests = getRequestsForDate(day)
                  const blocked = getBlockedDatesForDate(day)
                  const isToday = day.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] rounded-lg border p-1 ${isToday ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    >
                      <span
                        className={`text-xs block mb-1 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'
                          }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="truncate rounded bg-green-100 px-1 py-0.5 text-[10px] text-green-700 cursor-pointer hover:bg-green-200 transition-colors"
                            title={event.name}
                            onClick={() => handleEventClick(event, 'event')}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1"></span>
                            {event.name}
                          </div>
                        ))}
                        {requests.slice(0, 1).map((req) => (
                          <div
                            key={req.id}
                            className="truncate rounded bg-yellow-100 px-1 py-0.5 text-[10px] text-yellow-700 cursor-pointer hover:bg-yellow-200 transition-colors"
                            title={req.eventName}
                            onClick={() => handleEventClick(req, 'request')}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block mr-1"></span>
                            {req.eventName}
                          </div>
                        ))}
                        {blocked.slice(0, 1).map((b, i) => (
                          <div
                            key={i}
                            className="truncate rounded bg-red-100 px-1 py-0.5 text-[10px] text-red-700 cursor-pointer hover:bg-red-200 transition-colors"
                            title={b.reason}
                            onClick={() => handleEventClick(b, 'blocked')}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1"></span>
                            Blocked: {b.venueName}
                          </div>
                        ))}
                        {(events.length + requests.length + blocked.length) > 3 && (
                          <div className="text-[10px] text-muted-foreground text-center">
                            +{(events.length + requests.length + blocked.length) - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-4 text-xs justify-center border-t pt-4">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-green-100 border border-green-200" />
                  <span className="text-muted-foreground">Approved Event</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-yellow-100 border border-yellow-200" />
                  <span className="text-muted-foreground">Pending Request</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
                  <span className="text-muted-foreground">Blocked / Maintenance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Venue Management View */}
        {view === 'venues' && (
          <Card>
            <CardHeader>
              <CardTitle>Venue Management</CardTitle>
              <CardDescription>Manage all university venues and their availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {venues.map((venue) => (
                  <Card key={venue.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{venue.name}</h3>
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Capacity: {venue.capacity}</span>
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${venue.status === 'available'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                            }`}
                        >
                          {venue.status === 'available' ? 'Available' : 'Maintenance'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {venue.facilities.map((facility) => (
                          <span
                            key={facility}
                            className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                      {venue.blockedDates.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-muted-foreground">Blocked Dates:</p>
                          {venue.blockedDates.map((block, i) => (
                            <p key={i} className="text-xs text-destructive">
                              {block.start} - {block.end}: {block.reason}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => toggleVenueStatus(venue.id)}
                        >
                          {venue.status === 'available' ? 'Set Maintenance' : 'Set Available'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Venue Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this venue request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium text-foreground">{selectedRequest.eventName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.venueName} - {selectedRequest.requestedDate}
                </p>
              </div>
              <div>
                <Label htmlFor="reject-reason">Rejection Reason</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Enter the reason for rejection (minimum 20 characters)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1.5"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={rejectReason.length < 20}
                >
                  Reject Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Details Modal */}
      <Dialog open={showEventDetailsModal} onOpenChange={setShowEventDetailsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedEventDetails?.type === 'event' && 'Event Details'}
              {selectedEventDetails?.type === 'request' && 'Request Details'}
              {selectedEventDetails?.type === 'blocked' && 'Blocked Venue Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedEventDetails && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedEventDetails.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {selectedEventDetails.venue}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedEventDetails.date).toLocaleDateString() || 'N/A'}
                </div>
              </div>

              <div className="rounded-md bg-muted p-3 text-sm">
                {selectedEventDetails.description}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs
                        ${selectedEventDetails.type === 'event' ? 'bg-green-100 text-green-700' : ''}
                        ${selectedEventDetails.type === 'request' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${selectedEventDetails.type === 'blocked' ? 'bg-red-100 text-red-700' : ''}
                    `}>
                  {selectedEventDetails.status}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Dates Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Venue Dates</DialogTitle>
            <DialogDescription>
              Block a venue for maintenance or other purposes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="block-venue">Venue</Label>
              <Select value={blockVenueId} onValueChange={setBlockVenueId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="block-start">Start Date</Label>
                <Input
                  id="block-start"
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="block-end">End Date</Label>
                <Input
                  id="block-end"
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="block-reason">Reason</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleBlockDates}
                disabled={!blockVenueId || !blockStartDate || !blockEndDate || !blockReason}
              >
                Block Dates
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Venue Modal */}
      <Dialog open={showAddVenueModal} onOpenChange={setShowAddVenueModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>Add a new venue to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="venue-name">Venue Name</Label>
              <Input
                id="venue-name"
                placeholder="Enter venue name"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="venue-capacity">Capacity</Label>
              <Input
                id="venue-capacity"
                type="number"
                placeholder="Maximum capacity"
                value={newVenue.capacity}
                onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="venue-facilities">Facilities</Label>
              <Input
                id="venue-facilities"
                placeholder="Projector, WiFi, AC (comma separated)"
                value={newVenue.facilities}
                onChange={(e) => setNewVenue({ ...newVenue, facilities: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowAddVenueModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddVenue}
                disabled={!newVenue.name || !newVenue.capacity}
              >
                Add Venue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Dates Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Venue Dates</DialogTitle>
            <DialogDescription>
              Block a venue for maintenance or other purposes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="block-venue">Venue</Label>
              <Select value={blockVenueId} onValueChange={setBlockVenueId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="block-start">Start Date</Label>
                <Input
                  id="block-start"
                  type="date"
                  value={blockStartDate}
                  onChange={(e) => setBlockStartDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="block-end">End Date</Label>
                <Input
                  id="block-end"
                  type="date"
                  value={blockEndDate}
                  onChange={(e) => setBlockEndDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="block-reason">Reason</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowBlockModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleBlockDates}
                disabled={!blockVenueId || !blockStartDate || !blockEndDate || !blockReason}
              >
                Block Dates
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Venue Modal */}
      <Dialog open={showAddVenueModal} onOpenChange={setShowAddVenueModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>Add a new venue to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="venue-name">Venue Name</Label>
              <Input
                id="venue-name"
                placeholder="Enter venue name"
                value={newVenue.name}
                onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="venue-capacity">Capacity</Label>
              <Input
                id="venue-capacity"
                type="number"
                placeholder="Maximum capacity"
                value={newVenue.capacity}
                onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="venue-facilities">Facilities</Label>
              <Input
                id="venue-facilities"
                placeholder="Projector, WiFi, AC (comma separated)"
                value={newVenue.facilities}
                onChange={(e) => setNewVenue({ ...newVenue, facilities: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setShowAddVenueModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddVenue}
                disabled={!newVenue.name || !newVenue.capacity}
              >
                Add Venue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
