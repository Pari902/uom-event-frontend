'use client'

import { useState, useMemo } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  X,
  Download,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { mockEvents, mockRegistrations } from '@/lib/mock-data'

// Extended mock data for attendance
const mockAttendance = [
  {
    registrationId: 'reg-1',
    eventId: 'event-1',
    attended: true,
    checkInTime: '2026-02-15T09:15:00',
  },
  {
    registrationId: 'reg-3',
    eventId: 'event-3',
    attended: true,
    checkInTime: '2026-02-28T08:30:00',
  },
  // Past events for attendance history
  {
    registrationId: 'reg-past-1',
    eventId: 'past-event-1',
    attended: true,
    checkInTime: '2025-12-15T10:00:00',
  },
  {
    registrationId: 'reg-past-2',
    eventId: 'past-event-2',
    attended: false,
    checkInTime: null,
  },
  {
    registrationId: 'reg-past-3',
    eventId: 'past-event-3',
    attended: true,
    checkInTime: '2025-11-20T14:30:00',
  },
]

// Additional past events for demo
const pastEvents = [
  {
    id: 'past-event-1',
    name: 'Introduction to Web Development',
    category: 'technical',
    date: '2025-12-15',
    time: '10:00 - 16:00',
    venue: 'Engineering Auditorium',
  },
  {
    id: 'past-event-2',
    name: 'Annual Sports Day Opening Ceremony',
    category: 'sports',
    date: '2025-12-01',
    time: '08:00 - 12:00',
    venue: 'University Grounds',
  },
  {
    id: 'past-event-3',
    name: 'Cultural Night 2025',
    category: 'cultural',
    date: '2025-11-20',
    time: '18:00 - 22:00',
    venue: 'Open Air Theatre',
  },
]

const categoryColors: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  entertainment: 'bg-pink-100 text-pink-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-amber-100 text-amber-700',
  technical: 'bg-cyan-100 text-cyan-700',
}

export function AttendancePage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Combine all events (mock + past)
  const allEvents = useMemo(() => {
    return [...mockEvents, ...pastEvents]
  }, [])

  // Get attendance records for the current user
  const myAttendanceRecords = useMemo(() => {
    // Filter registrations for current user that are registered (not pending)
    const registeredEvents = mockRegistrations
      .filter((r) => r.studentId === user?.id && r.status === 'registered')
      .map((reg) => {
        const event = allEvents.find((e) => e.id === reg.eventId)
        const attendance = mockAttendance.find((a) => a.eventId === reg.eventId)
        const eventDate = event ? new Date(event.date) : new Date()
        const isPast = eventDate < new Date()

        return {
          ...reg,
          event,
          attended: attendance?.attended ?? false,
          checkInTime: attendance?.checkInTime ?? null,
          isPast,
        }
      })

    // Add past events from mock attendance
    const pastAttendanceRecords = mockAttendance
      .filter((a) => pastEvents.some((pe) => pe.id === a.eventId))
      .map((attendance) => {
        const event = pastEvents.find((e) => e.id === attendance.eventId)
        return {
          id: attendance.registrationId,
          eventId: attendance.eventId,
          eventName: event?.name || '',
          studentId: user?.id || '',
          studentName: user?.name || '',
          indexNumber: user?.indexNumber || '',
          status: 'registered' as const,
          qrCode: `QR-${attendance.eventId}-${user?.indexNumber}`,
          registeredAt: event?.date || '',
          event,
          attended: attendance.attended,
          checkInTime: attendance.checkInTime,
          isPast: true,
        }
      })

    return [...registeredEvents, ...pastAttendanceRecords]
  }, [user?.id, user?.name, user?.indexNumber, allEvents])

  // Filter past events only (attendance history)
  const attendanceHistory = useMemo(() => {
    return myAttendanceRecords.filter((record) => record.isPast)
  }, [myAttendanceRecords])

  // Apply search and filters
  const filteredRecords = useMemo(() => {
    return attendanceHistory.filter((record) => {
      if (!record.event) return false

      const matchesSearch = record.event.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'attended' && record.attended) ||
        (statusFilter === 'missed' && !record.attended)

      return matchesSearch && matchesStatus
    })
  }, [attendanceHistory, searchQuery, statusFilter])

  // Stats
  const totalEvents = attendanceHistory.length
  const attendedCount = attendanceHistory.filter((r) => r.attended).length
  const missedCount = attendanceHistory.filter((r) => !r.attended).length
  const attendanceRate = totalEvents > 0 ? Math.round((attendedCount / totalEvents) * 100) : 0

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Attendance</h1>
        <p className="text-muted-foreground">View your event attendance history</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attended</p>
                <p className="text-2xl font-bold text-foreground">{attendedCount}</p>
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
                <p className="text-sm text-muted-foreground">Missed</p>
                <p className="text-2xl font-bold text-foreground">{missedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <FileText className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
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
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
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
                    <SelectItem value="attended">Attended</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
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

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">No attendance records</p>
              <p className="text-muted-foreground">
                Your attendance history will appear here after participating in events
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Venue
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Check-in Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-foreground">{record.event?.name}</p>
                            <span
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                categoryColors[record.event?.category || ''] ||
                                'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {record.event?.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {record.event
                              ? new Date(record.event.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{record.event?.venue}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {record.attended ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            Attended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                            <XCircle className="h-3 w-3" />
                            Missed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {record.checkInTime ? (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(record.checkInTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
