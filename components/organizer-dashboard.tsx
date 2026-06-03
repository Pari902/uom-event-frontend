'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  Plus,
  Calendar,
  CreditCard,
  BarChart3,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/lib/auth-context'
import { eventApi } from '@/lib/api'
import { mockEvents, mockPaymentVerifications, mockVenues } from '@/lib/mock-data'
import type { Event, PaymentVerification, EventCategory, Faculty, Department, ApprovalLevel } from '@/lib/types'

export interface OrganizerDashboardProps {
  view?: 'dashboard' | 'events' | 'payments' | 'analytics'
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard/organizer', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/organizer/events', icon: Calendar },
  { label: 'Payments', href: '/dashboard/organizer/payments', icon: CreditCard },
  { label: 'Analytics', href: '/dashboard/organizer/analytics', icon: BarChart3 },
]
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_venue: 'bg-amber-100 text-amber-700',
  pending_venue_approval: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-blue-100 text-blue-700',
  pending_treasurer_approval: 'bg-blue-100 text-blue-700',
  pending_dean_approval: 'bg-blue-100 text-blue-700',
  pending_vice_chancellor_approval: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-gray-100 text-gray-700',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_venue: 'Pending Venue',
  pending_venue_approval: 'Pending Venue Approval',
  pending_approval: 'Pending Approval',
  pending_treasurer_approval: 'Pending Treasurer Approval',
  pending_dean_approval: 'Pending Dean Approval',
  pending_vice_chancellor_approval: 'Pending VC Approval',
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
  startTime: string
  endTime: string
  venueId: string
  capacityType: 'unlimited' | 'specific'
  capacity: string
  price: string
  isFree: boolean
  targetAudienceType: 'university_wide' | 'specific_faculties'
  targetFaculties: number[]
  targetDepartments: number[]
  bankDetails: string
}

const initialFormState: CreateEventForm = {
  name: '',
  description: '',
  category: 'academic',
  date: '',
  startTime: '',
  endTime: '',
  venueId: '',
  capacityType: 'unlimited',
  capacity: '',
  price: '',
  isFree: true,
  targetAudienceType: 'university_wide',
  targetFaculties: [],
  targetDepartments: [],
  bankDetails: ''
}

export function OrganizerDashboard({ view = 'dashboard' }: OrganizerDashboardProps) {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentVerification | null>(null)
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState<CreateEventForm>(initialFormState)

  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const [events, setEvents] = useState<Event[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [venues, setVenues] = useState<any[]>([])
  // Force empty state for payments as requested
  const [payments, setPayments] = useState<PaymentVerification[]>([])

  const myEvents = useMemo(() => {
    return events
  }, [events])

  const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState('')

const mapApproverTypeToLevel = (type: string): ApprovalLevel => {
  switch (type) {
    case 'VenueManager': return 'venue_manager';
    case 'Treasurer': return 'treasurer';
    case 'Dean': return 'dean';
    case 'ViceChancellor': return 'vice_chancellor';
    default: return 'venue_manager';
  }
}

// Helper: Map backend event to display format
const mapEventForDisplay = (e: any): Event => ({
  id: String(e.event_id),
  name: e.event_name,
  description: e.description,
  category: (e.event_category as string).toLowerCase() as EventCategory,
  date: e.event_date,
  time: `${e.start_time ? e.start_time.substring(0, 5) : '09:00'} - ${e.end_time ? e.end_time.substring(0, 5) : '17:00'}`,
  venue: e.venue_name || 'TBD',
  venueId: String(e.venue_id || ''),
  capacity: Number(e.capacity),
  registeredCount: Number(e.registered_count || 0),
  price: Number(e.ticket_price || 0),
  isFree: e.event_type === 'Free',
  organizer: user?.name || '',
  organizerId: String(e.organizer_id),
  department: user?.department || '',
  status: e.status.toLowerCase().replace(/ /g, '_') as Event['status'],
  approvalChain: e.approvalChain ? e.approvalChain.map((a: any) => ({
    level: mapApproverTypeToLevel(a.approver_type),
    status: a.approval_status.toLowerCase() as 'pending' | 'approved' | 'rejected',
    date: a.approval_date,
    comment: a.comments || a.rejection_reason || undefined
  })) : [],
  createdAt: e.created_date || '',
  bankDetails: e.bank_details || '',
  targetFaculties: typeof e.target_faculties === 'string' ? JSON.parse(e.target_faculties) : (e.target_faculties || []),
  targetDepartments: typeof e.target_departments === 'string' ? JSON.parse(e.target_departments) : (e.target_departments || []),
})

  // Split events for Dashboard view
  // Drafts
  const draftEvents = useMemo(() => {
    return myEvents.filter((e) => e.status === 'draft')
  }, [myEvents])

  // Pending Approvals
  const pendingEvents = useMemo(() => {
    return myEvents.filter((e) =>
      e.status.startsWith('pending')
    )
  }, [myEvents])

  // Filter events for "My Events" view (Approved only, exclude Rejected/Completed as requested)
  const approvedEvents = useMemo(() => {
    return myEvents.filter((e) =>
      ['approved', 'cancelled'].includes(e.status)
    )
  }, [myEvents])

  const rejectedEvents = useMemo(() => {
    return myEvents.filter((e) => e.status === 'rejected')
  }, [myEvents])

  const pendingPaymentsCount = useMemo(() => {
    const myEventIds = myEvents.map((e) => e.id)
    return payments.filter((p) => myEventIds.includes(p.eventId) && p.status === 'pending').length
  }, [myEvents, payments])

  const upcomingEventsCount = useMemo(() => {
    return myEvents.filter((e) => e.status === 'approved' && new Date(e.date) > new Date()).length
  }, [myEvents])

  const totalRegistrations = useMemo(() => {
    return myEvents.reduce((sum, e) => sum + e.registeredCount, 0)
  }, [myEvents])

  const myPendingPayments = useMemo(() => {
    const myEventIds = myEvents.map((e) => e.id)
    return payments.filter((p) => myEventIds.includes(p.eventId) && p.status === 'pending')
  }, [myEvents, payments])

  // Fetch my events on mount
useEffect(() => {
  if (user?.role === 'organizer') {
    eventApi.getMyEvents().then((res) => {
      if (res.success) {
        setEvents(res.data.map(mapEventForDisplay))
      }
    })
    eventApi.getFaculties().then((res) => {
      if (res.success) setFaculties(res.data)
    })
    eventApi.getDepartments().then((res) => {
      if (res.success) setDepartments(res.data)
    })
    eventApi.getVenues().then((res) => {
      if (res.success) setVenues(res.data)
    })
  }
}, [user])

  const handleCreateEvent = async (isDraft: boolean = false) => {
  try {
    setIsLoading(true)
    setError('')

    if (formData.startTime && formData.endTime) {
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [endH, endM] = formData.endTime.split(':').map(Number);
      if (endH * 60 + endM <= startH * 60 + startM) {
        setError('End time must be after start time');
        setIsLoading(false);
        return;
      }
    }

    // Map form data to backend API format
    const eventData = {
      eventName: formData.name,
      description: formData.description,
      eventCategory: formData.category.charAt(0).toUpperCase() + formData.category.slice(1), // Capitalize
      eventType: formData.isFree ? 'Free' : 'Paid',
      ticketPrice: formData.isFree ? 0 : parseInt(formData.price) || 0,
      capacity: formData.capacityType === 'unlimited' ? 0 : parseInt(formData.capacity) || 100,
      targetAudience: formData.targetAudienceType === 'university_wide' ? 'University-wide' : 'Faculty',
      targetFacultyId: null, // deprecated
      targetDepartmentId: null, // deprecated
      targetFaculties: formData.targetAudienceType === 'specific_faculties' ? formData.targetFaculties : [],
      targetDepartments: formData.targetAudienceType === 'specific_faculties' ? formData.targetDepartments : [],
      bankDetails: formData.isFree ? null : formData.bankDetails,
      eventDate: formData.date,
      startTime: formData.startTime || '09:00',
      endTime: formData.endTime || '17:00',
      registrationDeadline: (formData.date && formData.startTime) ? (() => {
        const start = formData.startTime || '09:00';
        const [hoursStr, minutesStr] = start.split(':');
        let hours = parseInt(hoursStr, 10);
        let minutes = parseInt(minutesStr, 10);
        
        // Subtract 5 minutes for safety
        minutes -= 5;
        if (minutes < 0) {
          minutes += 60;
          hours -= 1;
        }
        
        let deadlineDate = formData.date;
        if (hours < 0) {
          hours += 24;
          // Subtract 1 day from deadlineDate
          const parts = formData.date.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const dateObj = new Date(year, month, day);
            dateObj.setDate(dateObj.getDate() - 1);
            const prevYear = dateObj.getFullYear();
            const prevMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            const prevDay = String(dateObj.getDate()).padStart(2, '0');
            deadlineDate = `${prevYear}-${prevMonth}-${prevDay}`;
          }
        }
        
        const paddedHours = String(hours).padStart(2, '0');
        const paddedMinutes = String(minutes).padStart(2, '0');
        return `${deadlineDate}T${paddedHours}:${paddedMinutes}:00`;
      })() : (formData.date ? `${formData.date}T00:00:00` : null),
      venueId: parseInt(formData.venueId) || null,
      isDraft
    }

    let res;
    if (editingEventId) {
      res = await eventApi.updateEvent(Number(editingEventId), eventData)
    } else {
      res = await eventApi.createEvent(eventData)
    }

    if (res.success) {
      // Refresh events list
      const eventsRes = await eventApi.getMyEvents()
      if (eventsRes.success) {
        setEvents(eventsRes.data.map(mapEventForDisplay))
      }
      
      setShowCreateModal(false)
      setCreateStep(1)
      setFormData(initialFormState)
      setEditingEventId(null)
    } else {
      setError(res.message || 'Failed to create event')
    }
  } catch (error) {
    setError('Network error. Please try again.')
  } finally {
    setIsLoading(false)
  }
}

  const handleEditClick = (event: Event) => {
    setFormData({
      name: event.name,
      description: event.description,
      category: event.category,
      date: event.date ? event.date.substring(0, 10) : '',
      startTime: event.time ? event.time.split(' - ')[0] : '09:00',
      endTime: event.time ? event.time.split(' - ')[1] : '17:00',
      venueId: event.venueId,
      capacityType: event.capacity === null || event.capacity === 0 ? 'unlimited' : 'specific',
      capacity: event.capacity ? String(event.capacity) : '',
      price: event.price ? String(event.price) : '',
      isFree: event.isFree,
      targetAudienceType: (event.targetFaculties && event.targetFaculties.length > 0) ? 'specific_faculties' : 'university_wide',
      targetFaculties: event.targetFaculties || [],
      targetDepartments: event.targetDepartments || [],
      bankDetails: event.bankDetails || '',
    })
    setEditingEventId(event.id)
    setCreateStep(1)
    setShowCreateModal(true)
  }

  const handleViewClick = (event: Event) => {
    setSelectedEvent(event)
    setShowViewModal(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId))
  }

  const handleViewPayment = (payment: PaymentVerification) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handlePaymentAction = (paymentId: string, action: 'approved' | 'rejected') => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, status: action } : p
      )
    )
    setShowPaymentModal(false)
  }

  const updateFormData = (field: keyof CreateEventForm, value: string | boolean | number[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <DashboardLayout navItems={navItems} title="Organizer Dashboard">
      {/* Welcome Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">Manage your events and track registrations</p>
        </div>
        <Button onClick={() => {
          setEditingEventId(null)
          setFormData(initialFormState)
          setCreateStep(1)
          setShowCreateModal(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <CreditCard className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-foreground">{pendingPaymentsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold text-foreground">{upcomingEventsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-bold text-foreground">{totalRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <TrendingUp className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold text-foreground">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8">
            {/* Drafts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Drafts</h2>
              </div>
              {draftEvents.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <Edit className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">No draft events</p>
                  <p className="text-muted-foreground">Start creating an event to see it here</p>
                </Card>
              ) : (
                draftEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{event.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]
                                }`}
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
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}>
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
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
 
            {/* Pending Approvals Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Pending Approvals</h2>
              </div>
              {pendingEvents.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">No pending approvals</p>
                  <p className="text-muted-foreground">Events waiting for approval will appear here</p>
                </Card>
              ) : (
                pendingEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{event.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]
                                }`}
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
                              <Users className="h-4 w-4" />
                              {event.registeredCount} / {event.capacity}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewClick(event)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(event)}>
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
                          <div className="flex items-center gap-2">
                            {event.approvalChain.map((approval, index) => (
                              <div key={approval.level} className="flex items-center">
                                <div
                                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${approval.status === 'approved'
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
          </div>
        )}
 
        {/* My Events View */}
        {view === 'events' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">Approved Events</h2>
              {approvedEvents.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">No approved events</p>
                  <p>Once approved, events will appear here</p>
                </Card>
              ) : (
                approvedEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{event.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]
                                }`}
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
                              <Users className="h-4 w-4" />
                              {event.registeredCount} / {event.capacity}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewClick(event)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 bg-transparent"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight text-destructive">Rejected Requests</h2>
              {rejectedEvents.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed">
                  <XCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4 text-lg font-medium text-foreground">No rejected requests</p>
                  <p className="text-muted-foreground">Rejections from venue manager or other tiers will show here</p>
                </Card>
              ) : (
                rejectedEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden border-destructive/20 bg-destructive/5">
                    <CardContent className="p-0">
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-foreground">{event.name}</h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[event.status]
                                }`}
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
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewClick(event)}>
                            <Eye className="mr-1 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payments View */}
        {view === 'payments' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">Pending Payments</h2>
            {myPendingPayments.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <CheckCircle className="mx-auto h-12 w-12 text-success/50" />
                <p className="mt-4 text-lg font-medium text-foreground">All caught up!</p>
                <p className="text-muted-foreground">No pending payment verifications</p>
              </Card>
            ) : (
              myPendingPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{payment.studentName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Index: {payment.studentIndex}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Event: {payment.eventName}
                        </p>
                        <p className="mt-1 font-medium text-foreground">
                          Amount: Rs. {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(payment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPayment(payment)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View Slip
                        </Button>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handlePaymentAction(payment.id, 'approved')}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handlePaymentAction(payment.id, 'rejected')}
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
          </div>
        )}

        {/* Analytics View */}
        {view === 'analytics' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Registration Trends</CardTitle>
                <CardDescription>Monthly registration overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { name: 'Jan', value: 40 },
                      { name: 'Feb', value: 65 },
                      { name: 'Mar', value: 45 },
                      { name: 'Apr', value: 80 },
                      { name: 'May', value: 70 },
                      { name: 'Jun', value: 55 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-sm font-medium" />
                      <YAxis className="text-sm font-medium" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Events by Category</CardTitle>
                <CardDescription>Distribution of your events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Academic', value: 5, color: '#3b82f6' },
                          { name: 'Entertainment', value: 3, color: '#ec4899' },
                          { name: 'Sports', value: 4, color: '#22c55e' },
                          { name: 'Technical', value: 2, color: '#06b6d4' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Academic', value: 5, color: '#3b82f6' },
                          { name: 'Entertainment', value: 3, color: '#ec4899' },
                          { name: 'Sports', value: 4, color: '#22c55e' },
                          { name: 'Technical', value: 2, color: '#06b6d4' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Department-wise Registrations</CardTitle>
                <CardDescription>Top departments by registration count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { dept: 'CSE', count: 450, full: 'Computer Science & Engineering' },
                        { dept: 'ENTC', count: 380, full: 'Electronic & Telecommunication' },
                        { dept: 'Mech', count: 320, full: 'Mechanical Engineering' },
                        { dept: 'Civil', count: 280, full: 'Civil Engineering' },
                        { dept: 'Elec', count: 250, full: 'Electrical Engineering' },
                      ]}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                      <XAxis type="number" className="text-sm" />
                      <YAxis
                        dataKey="dept"
                        type="category"
                        className="text-sm font-medium"
                        width={60}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value} Registrations`]}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            return payload[0].payload.full;
                          }
                          return label;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--primary))"
                        radius={[0, 4, 4, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>Step {createStep} of 4</DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full ${step <= createStep ? 'bg-primary' : 'bg-muted'
                  }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {createStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="organized-by">Organized By</Label>
                <Input
                  id="organized-by"
                  value={user?.organizationType ? `${user.name} (${user.organizationType})` : (user?.name || "")}
                  disabled
                  className="mt-1.5 mb-4 bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  placeholder="Enter event name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  placeholder="Describe your event"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="mt-1.5"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="event-category">Category</Label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="event-start-time">Start Time</Label>
                  <Input
                    id="event-start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => updateFormData('startTime', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="event-end-time">End Time</Label>
                  <Input
                    id="event-end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => updateFormData('endTime', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              {formData.startTime && formData.endTime && (() => {
                const [startH, startM] = formData.startTime.split(':').map(Number);
                const [endH, endM] = formData.endTime.split(':').map(Number);
                if (endH * 60 + endM <= startH * 60 + startM) {
                  return (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      End time must be after start time.
                    </p>
                  );
                }
                return null;
              })()}
              <div>
                <Label htmlFor="event-venue">Venue</Label>
                <Select
                  value={formData.venueId}
                  onValueChange={(value) => updateFormData('venueId', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues
                      .filter((v) => v.status === 'Available' || v.status === 'available')
                      .map((venue) => (
                        <SelectItem key={String(venue.venue_id)} value={String(venue.venue_id)}>
                          {venue.venue_name} (Capacity: {venue.capacity})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label>Target Audience</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="targetAudienceType"
                      checked={formData.targetAudienceType === 'university_wide'}
                      onChange={() => updateFormData('targetAudienceType', 'university_wide')}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">University-wide</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="targetAudienceType"
                      checked={formData.targetAudienceType === 'specific_faculties'}
                      onChange={() => updateFormData('targetAudienceType', 'specific_faculties')}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Specific Faculties</span>
                  </label>
                </div>
              </div>

              {formData.targetAudienceType === 'specific_faculties' && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div>
                    <Label className="mb-2 block text-sm">Select Faculties</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                      {faculties.map((f) => (
                        <label key={f.faculty_id} className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={formData.targetFaculties.includes(f.faculty_id)}
                            onChange={(e) => {
                              const updated = e.target.checked 
                                ? [...formData.targetFaculties, f.faculty_id]
                                : formData.targetFaculties.filter(id => id !== f.faculty_id);
                              updateFormData('targetFaculties', updated);
                            }}
                          />
                          <span className="text-sm">{f.faculty_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.targetFaculties.length > 0 && (
                    <div className="mt-4">
                      <Label className="mb-2 block text-sm">Select Departments (Optional)</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                        {departments.filter(d => formData.targetFaculties.includes(d.faculty_id)).map((d) => (
                          <label key={d.department_id} className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={formData.targetDepartments.includes(d.department_id)}
                              onChange={(e) => {
                                const updated = e.target.checked 
                                  ? [...formData.targetDepartments, d.department_id]
                                  : formData.targetDepartments.filter(id => id !== d.department_id);
                                updateFormData('targetDepartments', updated);
                              }}
                            />
                            <span className="text-sm">{d.department_name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <Label>Capacity</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="capacityType"
                      checked={formData.capacityType === 'unlimited'}
                      onChange={() => updateFormData('capacityType', 'unlimited')}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Unlimited</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="capacityType"
                      checked={formData.capacityType === 'specific'}
                      onChange={() => updateFormData('capacityType', 'specific')}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Specific Number</span>
                  </label>
                </div>
              </div>

              {formData.capacityType === 'specific' && (
                <div>
                  <Label htmlFor="event-capacity">Total Capacity</Label>
                  <Input
                    id="event-capacity"
                    type="number"
                    placeholder="E.g. 500"
                    value={formData.capacity}
                    onChange={(e) => updateFormData('capacity', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                <Label>Event Type</Label>
                <div className="mt-2 flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="eventType"
                      checked={formData.isFree}
                      onChange={() => updateFormData('isFree', true)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Free Event</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="eventType"
                      checked={!formData.isFree}
                      onChange={() => updateFormData('isFree', false)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm text-foreground">Paid Event</span>
                  </label>
                </div>
              </div>

              {!formData.isFree && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event-price">Ticket Price (Rs.)</Label>
                    <Input
                      id="event-price"
                      type="number"
                      placeholder="Enter ticket price"
                      value={formData.price}
                      onChange={(e) => updateFormData('price', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank-details">Bank Details for Deposit</Label>
                    <Textarea
                      id="bank-details"
                      placeholder="Bank Name, Branch, Account Number, Account Name..."
                      value={formData.bankDetails}
                      onChange={(e) => updateFormData('bankDetails', e.target.value)}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {createStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-3 font-semibold text-foreground">Review Event Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium capitalize text-foreground">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium text-foreground">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium text-foreground">{formData.startTime} - {formData.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-medium text-foreground">
                      {venues.find((v) => String(v.venue_id) === formData.venueId)?.venue_name || 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Audience:</span>
                    <span className="font-medium text-foreground">{formData.targetAudienceType === 'university_wide' ? 'University-wide' : 'Specific Faculties'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium text-foreground">{formData.capacityType === 'unlimited' ? 'Unlimited' : formData.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium text-foreground">
                      {formData.isFree ? 'Free' : `Rs. ${formData.price}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Your event will be submitted for venue approval first.
                    {(formData.category === 'entertainment' && user?.organizationType?.includes('Faculty')) && (
                      <span> Then it will go through the multi-tier approval chain (Treasurer → Dean → Vice Chancellor).</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {createStep > 1 && (
              <Button variant="outline" onClick={() => setCreateStep(createStep - 1)}>
                Back
              </Button>
            )}
            {createStep === 4 && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleCreateEvent(true)}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => {
                if (createStep < 4) {
                  setCreateStep(createStep + 1)
                } else {
                  handleCreateEvent(false)
                }
              }}
              disabled={
                isLoading ||
                (createStep === 1 && (!formData.name || !formData.description)) ||
                (createStep === 2 && (
                  !formData.date || 
                  !formData.startTime || 
                  !formData.endTime || 
                  !formData.venueId ||
                  (() => {
                    const [startH, startM] = formData.startTime.split(':').map(Number);
                    const [endH, endM] = formData.endTime.split(':').map(Number);
                    return endH * 60 + endM <= startH * 60 + startM;
                  })()
                )) ||
                (createStep === 3 && (
                  (formData.capacityType === 'specific' && !formData.capacity) ||
                  (formData.targetAudienceType === 'specific_faculties' && formData.targetFaculties.length === 0) ||
                  (!formData.isFree && (!formData.price || !formData.bankDetails))
                ))
              }
            >
              {isLoading ? 'Processing...' : createStep < 4 ? 'Next' : 'Submit Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Slip Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
            <DialogDescription>
              Verify the payment details below
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium text-foreground">{selectedPayment.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Index:</span>
                    <span className="font-medium text-foreground">{selectedPayment.studentIndex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium text-foreground">Rs. {selectedPayment.amount.toLocaleString()}</span>
                  </div>
                  {selectedPayment.transactionRef && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ref:</span>
                      <span className="font-medium text-foreground">{selectedPayment.transactionRef}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Placeholder for payment slip image */}
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Payment slip image</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handlePaymentAction(selectedPayment.id, 'rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => handlePaymentAction(selectedPayment.id, 'approved')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Event Details Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Details submitted for this event
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="text-lg font-bold text-foreground mb-2">{selectedEvent.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{selectedEvent.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs">Category</span>
                    <span className="font-medium capitalize text-foreground">{selectedEvent.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Status</span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 mt-0.5 text-xs font-medium ${statusColors[selectedEvent.status]}`}>
                      {statusLabels[selectedEvent.status]}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Date</span>
                    <span className="font-medium text-foreground">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Time</span>
                    <span className="font-medium text-foreground">{selectedEvent.time}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Venue</span>
                    <span className="font-medium text-foreground">{selectedEvent.venue}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Capacity</span>
                    <span className="font-medium text-foreground">
                      {selectedEvent.capacity ? `${selectedEvent.registeredCount} / ${selectedEvent.capacity} Registered` : 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs">Type</span>
                    <span className="font-medium text-foreground">
                      {selectedEvent.isFree ? 'Free Event' : `Paid (Rs. ${selectedEvent.price})`}
                    </span>
                  </div>
                </div>

                {!selectedEvent.isFree && selectedEvent.bankDetails && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-muted-foreground block text-xs mb-1">Bank Details</span>
                    <p className="text-sm text-foreground bg-background p-2 rounded border border-border whitespace-pre-wrap">
                      {selectedEvent.bankDetails}
                    </p>
                  </div>
                )}
              </div>

              {/* Approval History */}
              {selectedEvent.status !== 'draft' && selectedEvent.approvalChain && selectedEvent.approvalChain.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Approval History</h4>
                  <div className="space-y-3">
                    {selectedEvent.approvalChain.map((approval) => (
                      <div key={approval.level} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                        <div className={`mt-0.5 rounded-full p-1 ${
                          approval.status === 'approved' ? 'bg-success/10 text-success' :
                          approval.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {approval.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                          {approval.status === 'rejected' && <XCircle className="h-4 w-4" />}
                          {approval.status === 'pending' && <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center gap-2">
                            <p className="font-medium capitalize text-sm text-foreground">{approval.level.replace('_', ' ')}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              approval.status === 'approved' ? 'bg-success/15 text-success' :
                              approval.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {approval.status}
                            </span>
                          </div>
                          {approval.comment && (
                            <p className="mt-1 text-sm text-muted-foreground bg-background p-2 rounded border italic">
                              "{approval.comment}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowViewModal(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
