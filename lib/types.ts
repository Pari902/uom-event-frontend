export type UserRole = 'student' | 'organizer' | 'venue_manager' | 'treasurer' | 'dean' | 'vice_chancellor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  indexNumber?: string
  avatar?: string
  status?: 'active' | 'inactive' | 'pending'
}

export type EventCategory = 'academic' | 'entertainment' | 'sports' | 'cultural' | 'technical'
export type EventStatus = 'draft' | 'pending_venue' | 'pending_approval' | 'approved' | 'rejected' | 'completed' | 'cancelled'
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
  capacity: number
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
  venueId: string
  venueName: string
  requestedDate: string
  requestedTime: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  createdAt: string
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
