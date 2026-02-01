'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  X,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { mockEvents, mockVenues } from '@/lib/mock-data'
import type { Event, EventCategory } from '@/lib/types'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_venue: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-gray-100 text-gray-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_venue: 'Pending Venue',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

interface CreateEventForm {
  name: string
  description: string
  category: EventCategory
  date: string
  time: string
  venueId: string
  capacity: string
  price: string
  isFree: boolean
}

const initialFormState: CreateEventForm = {
  name: '',
  description: '',
  category: 'academic',
  date: '',
  time: '',
  venueId: '',
  capacity: '',
  price: '',
  isFree: true,
}

export function OrganizerEventsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState<CreateEventForm>(initialFormState)
  const [events, setEvents] = useState<Event[]>(mockEvents)

  const myEvents = useMemo(() => {
    return events.filter((e) => e.organizerId === user?.id)
  }, [events, user?.id])

  const filteredEvents = useMemo(() => {
    return myEvents.filter((event) => {
      const matchesSearch =
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [myEvents, searchQuery, statusFilter])

  const handleCreateEvent = () => {
    const venue = mockVenues.find((v) => v.id === formData.venueId)
    const newEvent: Event = {
      id: `event-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      date: formData.date,
      time: formData.time,
      venue: venue?.name || '',
      venueId: formData.venueId,
      capacity: parseInt(formData.capacity) || 100,
      registeredCount: 0,
      price: formData.isFree ? 0 : parseInt(formData.price) || 0,
      isFree: formData.isFree,
      organizer: user?.name || '',
      organizerId: user?.id || '',
      department: user?.department || '',
      status: 'pending_venue',
      approvalChain: [
        { level: 'venue_manager', status: 'pending' },
        { level: 'treasurer', status: 'pending' },
        { level: 'dean', status: 'pending' },
        { level: 'vice_chancellor', status: 'pending' },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setEvents([newEvent, ...events])
    setShowCreateModal(false)
    setFormData(initialFormState)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId))
  }

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowViewModal(true)
  }

  const updateFormData = (field: keyof CreateEventForm, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Events</h1>
          <p className="text-muted-foreground">Manage all your events</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold text-foreground">{myEvents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-success">
              {myEvents.filter((e) => e.status === 'approved').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-warning">
              {myEvents.filter((e) => e.status === 'pending_venue' || e.status === 'pending_approval').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-destructive">
              {myEvents.filter((e) => e.status === 'rejected').length}
            </p>
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_venue">Pending Venue</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
        {filteredEvents.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">No events found</p>
            <p className="text-muted-foreground">Create your first event to get started</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]}`}
                      >
                        {statusLabels[event.status]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.venue}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.registeredCount} / {event.capacity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewEvent(event)}>
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 bg-transparent"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Approval Progress */}
                {event.status !== 'draft' && (
                  <div className="border-t border-border bg-muted/30 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Approval Progress</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {event.approvalChain.map((approval, index) => (
                        <div key={approval.level} className="flex items-center">
                          <div
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              approval.status === 'approved'
                                ? 'bg-success/10 text-success'
                                : approval.status === 'rejected'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {approval.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                            {approval.status === 'rejected' && <XCircle className="h-3 w-3" />}
                            {approval.status === 'pending' && <Clock className="h-3 w-3" />}
                            <span className="capitalize">{approval.level.replace('_', ' ')}</span>
                          </div>
                          {index < event.approvalChain.length - 1 && (
                            <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Fill in the details to create a new event</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="Enter event name"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Enter event description"
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData('category', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Select
                value={formData.venueId}
                onValueChange={(value) => updateFormData('venueId', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {mockVenues
                    .filter((v) => v.status === 'available')
                    .map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>
                        {venue.name} (Cap: {venue.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateFormData('date', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                value={formData.time}
                onChange={(e) => updateFormData('time', e.target.value)}
                placeholder="e.g., 09:00 - 16:00"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => updateFormData('capacity', e.target.value)}
                placeholder="Enter capacity"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Pricing</Label>
              <div className="mt-1.5 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing"
                    checked={formData.isFree}
                    onChange={() => updateFormData('isFree', true)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Free</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricing"
                    checked={!formData.isFree}
                    onChange={() => updateFormData('isFree', false)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Paid</span>
                </label>
              </div>
              {!formData.isFree && (
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder="Enter price (Rs.)"
                  className="mt-2"
                />
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Event Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
            <DialogDescription>Event details and approval status</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium capitalize text-foreground">{selectedEvent.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedEvent.status]}`}>
                    {statusLabels[selectedEvent.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium text-foreground">{selectedEvent.date} | {selectedEvent.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium text-foreground">{selectedEvent.venue}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium text-foreground">{selectedEvent.registeredCount} / {selectedEvent.capacity} registered</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium text-foreground">{selectedEvent.isFree ? 'Free' : `Rs. ${selectedEvent.price.toLocaleString()}`}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="mt-1 text-foreground">{selectedEvent.description}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Approval Chain</p>
                <div className="space-y-2">
                  {selectedEvent.approvalChain.map((approval) => (
                    <div key={approval.level} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="capitalize text-foreground">{approval.level.replace('_', ' ')}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        approval.status === 'approved' ? 'bg-success/10 text-success' :
                        approval.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {approval.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
