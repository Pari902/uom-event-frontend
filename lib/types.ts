export type UserRole = 'student' | 'organizer' | 'venue_manager' | 'treasurer' | 'dean' | 'vice_chancellor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  faculty?: string
  indexNumber?: string
  avatar?: string
  status?: 'active' | 'inactive' | 'pending'
  organizationType?: string
}

export type EventCategory = 'academic' | 'entertainment' | 'sports' | 'cultural' | 'technical'
export type EventStatus = 'draft' | 'pending_venue' | 'pending_venue_approval' | 'pending_treasurer_approval' | 'pending_dean_approval' | 'pending_vice_chancellor_approval' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'full'
export type RegistrationStatus = 'registered' | 'pending_payment' | 'payment_rejected' | 'cancelled'
export type ApprovalLevel = 'venue_manager' | 'treasurer' | 'dean' | 'vice_chancellor'

export interface Event {
  id: string
  name: string
  description: string
  category: EventCategory
  date: string
  time: string
  venue: string
  venueId: string
  capacity: number | null
  registeredCount: number
  price: number
  isFree: boolean
  organizer: string
  organizerId: string
  department: string
  status: EventStatus
  imageUrl?: string
  approvalChain: ApprovalRecord[]
  createdAt: string
  bankDetails?: string
  approvalId?: string
  organizerEmail?: string
  organizerPhone?: string
  organizerType?: string
  organizerDepartment?: string
  targetFaculties?: number[]
  targetDepartments?: number[]
}

export interface Faculty {
  faculty_id: number
  faculty_name: string
}

export interface Department {
  department_id: number
  faculty_id: number
  department_name: string
}

export interface ApprovalRecord {
  level: ApprovalLevel
  status: 'pending' | 'approved' | 'rejected'
  approverName?: string
  date?: string
  comment?: string
}

export interface Registration {
  id: string
  eventId: string
  eventName: string
  studentId: string
  studentName: string
  indexNumber: string
  status: RegistrationStatus
  paymentSlipUrl?: string
  transactionRef?: string
  qrCode?: string
  registeredAt: string
  rejectionReason?: string
}

export interface Venue {
  id: string
  name: string
  capacity: number
  facilities: string[]
  status: 'available' | 'maintenance'
  blockedDates: { start: string; end: string; reason: string }[]
}

export interface VenueRequest {
  id: string
  eventId: string
  eventName: string
  organizerName: string
  organizerDepartment: string
  organizerEmail?: string
  organizerPhone?: string
  organizerType?: string
  venueId: string
  venueName: string
  requestedDate: string
  requestedTime: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  createdAt: string
  description?: string
  category?: string
  eventType?: string
  ticketPrice?: number
  capacity?: number
  rejectionReason?: string
}

export interface PaymentVerification {
  id: string
  registrationId: string
  studentName: string
  studentIndex: string
  eventName: string
  eventId: string
  amount: number
  slipUrl: string
  transactionRef?: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface OrganizerApplication {
  id: string
  userId: string
  name: string
  email: string
  department: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedAt: string
}
