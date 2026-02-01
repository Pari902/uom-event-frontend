'use client'

import { useState, useMemo } from 'react'
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
import { mockEvents, mockPaymentVerifications, mockVenues } from '@/lib/mock-data'
import type { Event, PaymentVerification, EventCategory } from '@/lib/types'

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

export function OrganizerDashboard({ view = 'dashboard' }: OrganizerDashboardProps) {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentVerification | null>(null)
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState<CreateEventForm>(initialFormState)

  const [events, setEvents] = useState<Event[]>(mockEvents)
  // Force empty state for payments as requested
  const [payments, setPayments] = useState<PaymentVerification[]>([])

  const myEvents = useMemo(() => {
    return events.filter((e) => e.organizerId === user?.id)
  }, [events, user?.id])

  // Split events for Dashboard view
  // Drafts
  const draftEvents = useMemo(() => {
    return myEvents.filter((e) => e.status === 'draft')
  }, [myEvents])

  // Pending Approvals
  const pendingEvents = useMemo(() => {
    return myEvents.filter((e) =>
      ['pending_venue', 'pending_approval'].includes(e.status)
    )
  }, [myEvents])

  // Filter events for "My Events" view (Approved only, exclude Rejected/Completed as requested)
  const approvedEvents = useMemo(() => {
    return myEvents.filter((e) =>
      ['approved', 'cancelled'].includes(e.status)
    )
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
    setCreateStep(1)
    setFormData(initialFormState)
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

  const updateFormData = (field: keyof CreateEventForm, value: string | boolean) => {
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
        <Button onClick={() => setShowCreateModal(true)}>
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
                          <Button variant="outline" size="sm">
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight">All Events</h2>
            {approvedEvents.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground border-dashed">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium text-foreground">No active events</p>
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
                        <Button variant="outline" size="sm">
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
        <DialogContent className="max-w-lg">
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

          {createStep === 1 && (
            <div className="space-y-4">
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
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
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
              <div>
                <Label htmlFor="event-time">Time</Label>
                <Input
                  id="event-time"
                  placeholder="e.g., 09:00 - 17:00"
                  value={formData.time}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="mt-1.5"
                />
              </div>
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
                    {mockVenues
                      .filter((v) => v.status === 'available')
                      .map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} (Capacity: {venue.capacity})
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
                <Label htmlFor="event-capacity">Target Audience</Label>
                <Input
                  id="event-capacity"
                  type="text"
                  placeholder="Faculty/ Department/ University-wide"
                  value={formData.capacity}
                  onChange={(e) => updateFormData('capacity', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
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
                    <span className="font-medium text-foreground">{formData.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue:</span>
                    <span className="font-medium text-foreground">
                      {mockVenues.find((v) => v.id === formData.venueId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Audience:</span>
                    <span className="font-medium text-foreground">{formData.capacity}</span>
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
                    Your event will be submitted for venue approval first, then go through
                    the approval chain (Treasurer → Dean → Vice Chancellor).
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
            <Button
              className="flex-1"
              onClick={() => {
                if (createStep < 4) {
                  setCreateStep(createStep + 1)
                } else {
                  handleCreateEvent()
                }
              }}
              disabled={
                (createStep === 1 && (!formData.name || !formData.description)) ||
                (createStep === 2 && (!formData.date || !formData.time || !formData.venueId)) ||
                (createStep === 3 && !formData.capacity)
              }
            >
              {createStep < 4 ? 'Next' : 'Submit Event'}
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
    </DashboardLayout>
  )
}
