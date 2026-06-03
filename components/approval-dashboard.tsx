'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  LayoutDashboard,
  FileCheck,
  History,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { approvalApi } from '@/lib/api'
import type { Event, ApprovalLevel, UserRole, EventCategory } from '@/lib/types'



const roleToApprovalLevel: Record<UserRole, ApprovalLevel | null> = {
  treasurer: 'treasurer',
  dean: 'dean',
  vice_chancellor: 'vice_chancellor',
  student: null,
  organizer: null,
  venue_manager: null,
  admin: null,
}

const approvalLevelOrder: ApprovalLevel[] = ['venue_manager', 'treasurer', 'dean', 'vice_chancellor']

const approvalLevelLabels: Record<ApprovalLevel, string> = {
  venue_manager: 'Venue Manager',
  treasurer: 'Treasurer',
  dean: 'Dean',
  vice_chancellor: 'Vice Chancellor',
}

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  entertainment: 'bg-pink-100 text-pink-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-amber-100 text-amber-700',
  technical: 'bg-cyan-100 text-cyan-700',
}

export interface ApprovalDashboardProps {
  view?: 'dashboard' | 'history'
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard/approval', icon: LayoutDashboard },
  { label: 'History', href: '/dashboard/approval/history', icon: History },
]

// Helper: Map backend approval and event data to Event interface
const mapEventFromApproval = (item: any): Event => {
  const mappedChain = (item.previousApprovals || []).map((prev: any) => ({
    level: prev.approver_type.toLowerCase() === 'venuemanager' ? 'venue_manager'
         : prev.approver_type.toLowerCase() === 'treasurer' ? 'treasurer'
         : prev.approver_type.toLowerCase() === 'dean' ? 'dean'
         : 'vice_chancellor',
    status: prev.approval_status.toLowerCase() as 'pending' | 'approved' | 'rejected',
    approverName: prev.approver_type.toLowerCase() === 'venuemanager' ? 'Venue Manager'
                : prev.approver_type.toLowerCase() === 'treasurer' ? 'Treasurer'
                : prev.approver_type.toLowerCase() === 'dean' ? 'Dean'
                : 'Vice Chancellor',
    date: prev.approval_date,
    comment: prev.comments || prev.rejection_reason || undefined
  }));

  // Add current level's status to the chain
  mappedChain.push({
    level: item.approver_type.toLowerCase() === 'venuemanager' ? 'venue_manager'
         : item.approver_type.toLowerCase() === 'treasurer' ? 'treasurer'
         : item.approver_type.toLowerCase() === 'dean' ? 'dean'
         : 'vice_chancellor',
    status: item.approval_status.toLowerCase() as 'pending' | 'approved' | 'rejected',
    approverName: item.approver_type.toLowerCase() === 'venuemanager' ? 'Venue Manager'
                : item.approver_type.toLowerCase() === 'treasurer' ? 'Treasurer'
                : item.approver_type.toLowerCase() === 'dean' ? 'Dean'
                : 'Vice Chancellor',
    date: item.approval_date,
    comment: item.comments || item.rejection_reason || undefined
  });

  return {
    id: item.event_id.toString(),
    approvalId: item.approval_id.toString(),
    name: item.event_name,
    description: item.description || '',
    category: item.event_category?.toLowerCase() as EventCategory,
    date: item.event_date ? (() => {
      const d = new Date(item.event_date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })() : '',
    time: `${item.start_time ? item.start_time.substring(0, 5) : '09:00'} - ${item.end_time ? item.end_time.substring(0, 5) : '17:00'}`,
    venue: item.venue_name || 'TBD',
    venueId: (item.venue_id || '').toString(),
    capacity: item.capacity ? Number(item.capacity) : null,
    registeredCount: Number(item.registration_count || 0),
    price: Number(item.ticket_price || 0),
    isFree: item.event_type === 'Free',
    organizer: item.organizer_name || 'Organizer',
    organizerId: '',
    organizerEmail: item.organizer_email || '',
    organizerPhone: item.organizer_phone || '',
    organizerType: item.organizer_type || '',
    organizerDepartment: item.organizer_department || '',
    department: item.organizer_department || '',
    status: item.approval_status.toLowerCase() === 'pending' ? 'pending_approval' : item.approval_status.toLowerCase() as any,
    approvalChain: mappedChain,
    createdAt: item.approval_date || '',
    bankDetails: item.bank_details || '',
  };
}

export function ApprovalDashboard({ view = 'dashboard' }: ApprovalDashboardProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approvalComment, setApprovalComment] = useState('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    if (user) {
      approvalApi.getPendingApprovals()
        .then((res) => {
          if (res && res.success && Array.isArray(res.data)) {
            setEvents(res.data.map(mapEventFromApproval))
          }
        })
        .catch((err) => {
          console.error('Error fetching approvals:', err)
        })
    }
  }, [user])

  const userApprovalLevel = user?.role ? roleToApprovalLevel[user.role] : null

  const getPreviousLevel = (level: ApprovalLevel): ApprovalLevel | null => {
    const index = approvalLevelOrder.indexOf(level)
    return index > 0 ? approvalLevelOrder[index - 1] : null
  }

  const canApprove = (event: Event): boolean => {
    if (!userApprovalLevel) return false

    const userLevelIndex = approvalLevelOrder.indexOf(userApprovalLevel)
    const userApproval = event.approvalChain.find((a) => a.level === userApprovalLevel)

    if (!userApproval || userApproval.status !== 'pending') return false

    // Check if all previous levels are approved
    for (let i = 0; i < userLevelIndex; i++) {
      const prevApproval = event.approvalChain.find((a) => a.level === approvalLevelOrder[i])
      if (!prevApproval || prevApproval.status !== 'approved') return false
    }

    return true
  }

  const pendingEvents = useMemo(() => {
    return events.filter((event) => {
      if (event.status === 'approved' || event.status === 'rejected' || event.status === 'draft') {
        return false
      }
      return canApprove(event)
    })
  }, [events, userApprovalLevel])

  const approvedByMe = useMemo(() => {
    return events.filter((event) => {
      if (!userApprovalLevel) return false
      const approval = event.approvalChain.find((a) => a.level === userApprovalLevel)
      return approval?.status === 'approved'
    })
  }, [events, userApprovalLevel])

  const rejectedByMe = useMemo(() => {
    return events.filter((event) => {
      if (!userApprovalLevel) return false
      const approval = event.approvalChain.find((a) => a.level === userApprovalLevel)
      return approval?.status === 'rejected'
    })
  }, [events, userApprovalLevel])

  // Get full history for the timeline view
  const allMyInteractions = useMemo(() => {
    return events.filter((event) => {
      if (!userApprovalLevel) return false
      const approval = event.approvalChain.find((a) => a.level === userApprovalLevel)
      return approval?.status !== 'pending'
    }).sort((a, b) => {
      // Sort by interaction date, fallback to created date
      const aApproval = a.approvalChain.find(ap => ap.level === userApprovalLevel)
      const bApproval = b.approvalChain.find(ap => ap.level === userApprovalLevel)
      const aDate = aApproval?.date || a.createdAt
      const bDate = bApproval?.date || b.createdAt
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [events, userApprovalLevel])

  const handleOpenApproveModal = (event: Event) => {
    setSelectedEvent(event)
    setShowApproveModal(true)
    setApprovalComment('')
  }

  const handleApproveConfirm = async () => {
    if (!selectedEvent || !selectedEvent.approvalId || !userApprovalLevel) return

    try {
      const res = await approvalApi.approveEvent(Number(selectedEvent.approvalId), approvalComment)
      if (res && res.success) {
        setEvents(prevEvents => prevEvents.map((event) => {
          if (event.id !== selectedEvent.id) return event

          const updatedChain = event.approvalChain.map((approval) =>
            approval.level === userApprovalLevel
              ? {
                ...approval,
                status: 'approved' as const,
                date: new Date().toISOString(),
                comment: approvalComment || undefined,
              }
              : approval
          )

          return {
            ...event,
            approvalChain: updatedChain,
            status: 'approved' as any,
          }
        }))
        setShowApproveModal(false)
        setApprovalComment('')
        setSelectedEvent(null)
      } else {
        alert(res?.message || 'Failed to approve request')
      }
    } catch (err) {
      console.error('Error approving event request:', err)
      alert('An error occurred while approving the request')
    }
  }

  const handleReject = async () => {
    if (!selectedEvent || !selectedEvent.approvalId || !userApprovalLevel || rejectReason.length < 20) return

    try {
      const res = await approvalApi.rejectEvent(Number(selectedEvent.approvalId), rejectReason)
      if (res && res.success) {
        setEvents(prevEvents => prevEvents.map((event) => {
          if (event.id !== selectedEvent.id) return event

          const updatedChain = event.approvalChain.map((approval) =>
            approval.level === userApprovalLevel
              ? {
                ...approval,
                status: 'rejected' as const,
                date: new Date().toISOString(),
                comment: rejectReason,
              }
              : approval
          )

          return {
            ...event,
            status: 'rejected' as any,
            approvalChain: updatedChain,
          }
        }))
        setShowRejectModal(false)
        setRejectReason('')
        setSelectedEvent(null)
      } else {
        alert(res?.message || 'Failed to reject request')
      }
    } catch (err) {
      console.error('Error rejecting event request:', err)
      alert('An error occurred while rejecting the request')
    }
  }

  const openRejectModal = (event: Event) => {
    setSelectedEvent(event)
    setShowRejectModal(true)
    setRejectReason('')
  }

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetailsModal(true)
  }

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents)
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId)
    } else {
      newExpanded.add(eventId)
    }
    setExpandedEvents(newExpanded)
  }

  const renderApprovalCard = (event: Event, showActions: boolean = true) => {
    const isExpanded = expandedEvents.has(event.id)

    return (
      <Card key={event.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-foreground">{event.name}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${categoryColors[event.category] || 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {event.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Organizer: {event.organizer} ({event.department})
                </p>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.date + 'T00:00:00').toLocaleDateString()}</span>
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
                    <Users className="h-4 w-4" />
                    <span>Capacity: {event.capacity ?? 'Unlimited'}</span>
                  </div>
                </div>
                {!event.isFree && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">
                      Ticket: Rs. {event.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      (Expected Revenue: Rs. {event.capacity ? (event.price * event.capacity).toLocaleString() : 'Variable'})
                    </span>
                  </div>
                )}

                {/* Visual Approval Chain Checkmarks */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {event.approvalChain
                    .filter((approval) => {
                      // For treasurer, only show venue_manager and treasurer
                      if (userApprovalLevel === 'treasurer') {
                        return ['venue_manager', 'treasurer'].includes(approval.level)
                      }
                      // For dean, show venue_manager, treasurer, and dean
                      if (userApprovalLevel === 'dean') {
                        return ['venue_manager', 'treasurer', 'dean'].includes(approval.level)
                      }
                      return true
                    })
                    .map((approval) => {
                      // Only show checkmarks for previous steps or current step if approved
                      const isPrevious = approvalLevelOrder.indexOf(approval.level) < approvalLevelOrder.indexOf(userApprovalLevel || 'venue_manager');
                      const isCurrentApproved = approval.level === userApprovalLevel && approval.status === 'approved';

                      if (isPrevious || isCurrentApproved) {
                        return (
                          <div key={approval.level} className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>{approvalLevelLabels[approval.level]}</span>
                            {approval.date && <span className="text-muted-foreground">({new Date(approval.date).toLocaleDateString()})</span>}
                          </div>
                        )
                      }
                      return null;
                    })}
                </div>

              </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-transparent border-input hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleViewDetails(event)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    {showActions && canApprove(event) && (
                      <>
                        <Button
                          size="sm"
                          className="bg-success text-success-foreground hover:bg-success/90"
                          onClick={() => handleOpenApproveModal(event)}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectModal(event)}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

          {/* Approval Chain (Expandable details) */}
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <button
              type="button"
              onClick={() => toggleExpanded(event.id)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="font-medium text-muted-foreground">Approval Progress & Comments</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-4 space-y-3">
                {event.approvalChain
                  .filter((approval) => {
                    // For treasurer, only show venue_manager and treasurer
                    if (userApprovalLevel === 'treasurer') {
                      return ['venue_manager', 'treasurer'].includes(approval.level)
                    }
                    // For dean, show venue_manager, treasurer, and dean
                    if (userApprovalLevel === 'dean') {
                      return ['venue_manager', 'treasurer', 'dean'].includes(approval.level)
                    }
                    return true
                  })
                  .map((approval) => (
                    <div
                      key={approval.level}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {approvalLevelLabels[approval.level]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${approval.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : approval.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                      </div>
                      {approval.approverName && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          By: {approval.approverName}
                        </p>
                      )}
                      {approval.date && (
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(approval.date).toLocaleDateString()}
                        </p>
                      )}
                      {approval.comment && (
                        <div className="mt-2 flex items-start gap-2 rounded bg-muted p-2">
                          <MessageSquare className="mt-0.5 h-3 w-3 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{approval.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render History Timeline Item
  const renderHistoryItem = (event: Event) => {
    const myApproval = event.approvalChain.find(a => a.level === userApprovalLevel);

    return (
      <div key={event.id} className="relative pl-8 pb-8 border-l-2 border-muted last:border-0 last:pb-0">
        <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 bg-background
                   ${myApproval?.status === 'approved' ? 'border-green-500' : 'border-red-500'}
               `}></div>

        <div className="mb-1 text-sm text-muted-foreground">
          {myApproval?.date ? new Date(myApproval.date).toLocaleDateString() : 'Unknown Date'}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold">{event.name}</h4>
                <p className="text-sm text-muted-foreground">by {event.organizer} ({event.department})</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize
                                 ${myApproval?.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                             `}>
                {myApproval?.status}
              </span>
            </div>
            {myApproval?.comment && (
              <div className="bg-muted/50 p-2 rounded text-sm italic text-muted-foreground">
                "{myApproval.comment}"
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DashboardLayout navItems={navItems} title={`${approvalLevelLabels[userApprovalLevel || 'treasurer']} Dashboard`}>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Review and approve event requests as {approvalLevelLabels[userApprovalLevel || 'treasurer']}
        </p>
      </div>

      {view === 'dashboard' && (
        <>
          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-warning/10 p-2">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approvals</p>
                    <p className="text-2xl font-bold text-foreground">{pendingEvents.length}</p>
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
                    <p className="text-sm text-muted-foreground">Approved by Me</p>
                    <p className="text-2xl font-bold text-foreground">{approvedByMe.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rejected by Me</p>
                    <p className="text-2xl font-bold text-foreground">{rejectedByMe.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pending
                {pendingEvents.length > 0 && (
                  <span className="ml-2 rounded-full bg-warning px-2 py-0.5 text-xs text-warning-foreground">
                    {pendingEvents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <div className="space-y-4">
                {pendingEvents.length === 0 ? (
                  <Card className="p-8 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-success" />
                    <p className="mt-4 text-lg font-medium text-foreground">All caught up!</p>
                    <p className="text-muted-foreground">No pending approvals at the moment</p>
                  </Card>
                ) : (
                  pendingEvents.map((event) => renderApprovalCard(event, true))
                )}
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <div className="space-y-4">
                {approvedByMe.length === 0 ? (
                  <Card className="p-8 text-center">
                    <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium text-foreground">No approved events</p>
                    <p className="text-muted-foreground">Events you approve will appear here</p>
                  </Card>
                ) : (
                  approvedByMe.map((event) => renderApprovalCard(event, false))
                )}
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="space-y-4">
                {rejectedByMe.length === 0 ? (
                  <Card className="p-8 text-center">
                    <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium text-foreground">No rejected events</p>
                    <p className="text-muted-foreground">Events you reject will appear here</p>
                  </Card>
                ) : (
                  rejectedByMe.map((event) => renderApprovalCard(event, false))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {view === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Approval History</CardTitle>
            <CardDescription>Timeline of your approval actions</CardDescription>
          </CardHeader>
          <CardContent>
            {allMyInteractions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No approval history found.
              </div>
            ) : (
              <div className="mt-4 ml-2">
                {allMyInteractions.map(renderHistoryItem)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this event (minimum 20 characters)
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium text-foreground">{selectedEvent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.organizer} - {selectedEvent.department}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.venue} | {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label htmlFor="reject-reason">Rejection Reason</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Please provide a detailed reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1.5"
                  rows={4}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {rejectReason.length}/20 characters minimum
                </p>
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
                  Reject Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Event Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this event booking request?
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
                <p className="font-semibold text-foreground">{selectedEvent.name}</p>
                <p className="text-muted-foreground">
                  Venue: {selectedEvent.venue}
                </p>
                <p className="text-muted-foreground">
                  Date: {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString()}
                </p>
                <p className="text-muted-foreground">
                  Time: {selectedEvent.time}
                </p>
              </div>
              <div>
                <Label htmlFor="approve-comment">Approval Comments (Optional)</Label>
                <Textarea
                  id="approve-comment"
                  placeholder="Enter any comments or special instructions (optional)"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="mt-1.5 font-sans"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    setShowApproveModal(false)
                    setSelectedEvent(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                  onClick={handleApproveConfirm}
                >
                  Confirm Approval
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
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Event Specifications Card */}
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="border-b pb-2 border-border/60">
                  <h4 className="font-semibold text-xs text-primary uppercase tracking-wider mb-1">Event Specifications</h4>
                  <h3 className="font-bold text-lg text-foreground">{selectedEvent.name}</h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Description</span>
                    <div className="rounded bg-muted p-2 mt-1 text-sm text-foreground whitespace-pre-wrap font-sans">
                      {selectedEvent.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Requested Venue</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedEvent.venue}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Date</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedEvent.date ? new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted-foreground block font-medium">Requested Time (Start - End)</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedEvent.time || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Category</span>
                      <span className="font-medium text-foreground capitalize mt-0.5 block">{selectedEvent.category || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Event Type</span>
                      <span className="font-medium text-foreground capitalize mt-0.5 block">{selectedEvent.isFree ? 'Free' : 'Paid'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Target Capacity</span>
                      <span className="font-medium text-foreground mt-0.5 block">{selectedEvent.capacity || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Ticket Price</span>
                      <span className="font-medium text-foreground mt-0.5 block">
                        {!selectedEvent.isFree ? `LKR ${selectedEvent.price.toLocaleString()}` : 'Free'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details Card (if paid event) */}
              {!selectedEvent.isFree && selectedEvent.bankDetails && (
                <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                  <div className="border-b pb-2 border-border/60">
                    <h4 className="font-semibold text-xs text-primary uppercase tracking-wider mb-1">Bank Transfer Details</h4>
                  </div>
                  <div className="rounded bg-muted p-2 mt-1 text-sm text-foreground whitespace-pre-wrap font-mono">
                    {selectedEvent.bankDetails}
                  </div>
                </div>
              )}

              {/* Organizer Profile Card */}
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="border-b pb-2 border-border/60">
                  <h4 className="font-semibold text-xs text-primary uppercase tracking-wider">Organizer Profile</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Name</span>
                    <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {selectedEvent.organizer}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Organization Type</span>
                    <span className="font-medium text-foreground capitalize mt-0.5 block">{selectedEvent.organizerType || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Department</span>
                    <span className="font-medium text-foreground mt-0.5 block">{selectedEvent.organizerDepartment || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Email Address</span>
                    <span className="font-medium text-foreground break-all mt-0.5 block">{selectedEvent.organizerEmail || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block font-medium">Telephone Number</span>
                    <span className="font-medium text-foreground mt-0.5 block">{selectedEvent.organizerPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Approval Chain Progress Card */}
              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <div className="border-b pb-2 border-border/60">
                  <h4 className="font-semibold text-xs text-primary uppercase tracking-wider">Approval Progress & Comments</h4>
                </div>
                <div className="space-y-3 mt-2">
                  {selectedEvent.approvalChain.map((approval) => (
                    <div
                      key={approval.level}
                      className="rounded border border-border bg-muted/20 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {approvalLevelLabels[approval.level]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${approval.status === 'approved'
                            ? 'bg-success/10 text-success'
                            : approval.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-muted text-muted-foreground'
                            }`}
                        >
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                      </div>
                      {approval.date && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Date: {new Date(approval.date).toLocaleDateString()}
                        </p>
                      )}
                      {approval.comment && (
                        <div className="mt-2 flex items-start gap-2 rounded bg-muted p-2 text-xs">
                          <MessageSquare className="mt-0.5 h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <p className="text-muted-foreground whitespace-pre-wrap">{approval.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowEventDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
