'use client'

import { useState, useMemo } from 'react'
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
import { mockEvents } from '@/lib/mock-data'
import type { Event, ApprovalLevel, UserRole } from '@/lib/types'



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

export function ApprovalDashboard({ view = 'dashboard' }: ApprovalDashboardProps) {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approvalComment, setApprovalComment] = useState('')
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('pending')

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

  const handleApprove = (eventId: string) => {
    if (!userApprovalLevel) return

    setEvents(
      events.map((event) => {
        if (event.id !== eventId) return event

        const updatedChain = event.approvalChain.map((approval) =>
          approval.level === userApprovalLevel
            ? {
              ...approval,
              status: 'approved' as const,
              approverName: user?.name,
              date: new Date().toISOString().split('T')[0],
              comment: approvalComment || undefined,
            }
            : approval
        )

        // Check if all levels are approved
        const allApproved = updatedChain.every((a) => a.status === 'approved')

        return {
          ...event,
          approvalChain: updatedChain,
          status: allApproved ? 'approved' : 'pending_approval',
        }
      })
    )
    setApprovalComment('')
    // Show toast ideally
  }

  const handleReject = () => {
    if (!selectedEvent || !userApprovalLevel || rejectReason.length < 20) return

    setEvents(
      events.map((event) => {
        if (event.id !== selectedEvent.id) return event

        return {
          ...event,
          status: 'rejected',
          approvalChain: event.approvalChain.map((approval) =>
            approval.level === userApprovalLevel
              ? {
                ...approval,
                status: 'rejected' as const,
                approverName: user?.name,
                date: new Date().toISOString().split('T')[0],
                comment: rejectReason,
              }
              : approval
          ),
        }
      })
    )

    setShowRejectModal(false)
    setRejectReason('')
    setSelectedEvent(null)
  }

  const openRejectModal = (event: Event) => {
    setSelectedEvent(event)
    setShowRejectModal(true)
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
                    <span>{new Date(event.date).toLocaleDateString()}</span>
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
                    <span>Capacity: {event.capacity}</span>
                  </div>
                </div>
                {!event.isFree && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="font-medium text-foreground">
                      Ticket: Rs. {event.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      (Expected Revenue: Rs. {(event.price * event.capacity).toLocaleString()})
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
              {showActions && canApprove(event) && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => handleApprove(event.id)}
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
                </div>
              )}
            </div>

            {/* Comment field for approval */}
            {showActions && canApprove(event) && (
              <div className="mt-4">
                <Label htmlFor={`comment-${event.id}`} className="text-sm">
                  Comment (Optional)
                </Label>
                <Textarea
                  id={`comment-${event.id}`}
                  placeholder="Add a comment for the approval..."
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            )}
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
                  {selectedEvent.venue} | {selectedEvent.date}
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
    </DashboardLayout>
  )
}
