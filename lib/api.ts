const API_BASE_URL = 'http://localhost:5000/api'

// Helper: make authenticated requests
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

const headers = (includeAuth = false): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (includeAuth) {
    const token = getToken()
    if (token) h['Authorization'] = `Bearer ${token}`
  }
  return h
}

// ============ AUTH APIs ============

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    })
    return res.json()
  },

  register: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },
}

// ============ EVENT APIs ============

export const eventApi = {
  getAllEvents: async (filters?: Record<string, string>) => {
    const params = filters ? new URLSearchParams(filters).toString() : ''
    const res = await fetch(`${API_BASE_URL}/events${params ? '?' + params : ''}`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },

  getEventById: async (eventId: number) => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },

  createEvent: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  getMyEvents: async () => {
    const res = await fetch(`${API_BASE_URL}/events/my-events`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },

  getFaculties: async () => {
    const res = await fetch(`${API_BASE_URL}/events/faculties`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },

  getDepartments: async () => {
    const res = await fetch(`${API_BASE_URL}/events/departments`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },

  getVenues: async () => {
    const res = await fetch(`${API_BASE_URL}/events/venues`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },

  deleteVenue: async (venueId: string) => {
    const res = await fetch(`${API_BASE_URL}/events/venues/${venueId}`, {
      method: 'DELETE',
      headers: headers(true),
    })
    return res.json()
  },

  updateVenue: async (venueId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events/venues/${venueId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  createVenue: async (data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events/venues`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  blockVenue: async (venueId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events/venues/${venueId}/block`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  unblockVenue: async (venueId: string, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events/venues/${venueId}/unblock`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },

  updateEvent: async (eventId: number, data: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(data),
    })
    return res.json()
  },
}

// ============ REGISTRATION APIs ============

export const registrationApi = {
  registerFree: async (eventId: number) => {
    const res = await fetch(`${API_BASE_URL}/registrations/free`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ eventId }),
    })
    return res.json()
  },

  registerPaid: async (eventId: number, bankSlip: File, transactionReference?: string) => {
    const formData = new FormData()
    formData.append('eventId', eventId.toString())
    formData.append('bankSlip', bankSlip)
    if (transactionReference) formData.append('transactionReference', transactionReference)

    const res = await fetch(`${API_BASE_URL}/registrations/paid`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` }, // No Content-Type for FormData
      body: formData,
    })
    return res.json()
  },

  getMyRegistrations: async () => {
    const res = await fetch(`${API_BASE_URL}/registrations/my-registrations`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },

  reuploadSlip: async (registrationId: number, bankSlip: File, transactionReference?: string) => {
    const formData = new FormData()
    formData.append('bankSlip', bankSlip)
    if (transactionReference) formData.append('transactionReference', transactionReference)

    const res = await fetch(`${API_BASE_URL}/registrations/reupload/${registrationId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    })
    return res.json()
  },

  getPendingPayments: async () => {
    const res = await fetch(`${API_BASE_URL}/registrations/pending-payments`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },

  approvePayment: async (paymentId: number) => {
    const res = await fetch(`${API_BASE_URL}/registrations/approve/${paymentId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({}),
    })
    return res.json()
  },

  rejectPayment: async (paymentId: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/registrations/reject/${paymentId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({ reason }),
    })
    return res.json()
  },
}

// ============ APPROVAL APIs ============

export const approvalApi = {
  getPendingApprovals: async () => {
    const res = await fetch(`${API_BASE_URL}/approvals/pending`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },

  approveEvent: async (approvalId: number, comments?: string) => {
    const res = await fetch(`${API_BASE_URL}/approvals/approve/${approvalId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({ comments }),
    })
    return res.json()
  },

  rejectEvent: async (approvalId: number, rejectionReason: string) => {
    const res = await fetch(`${API_BASE_URL}/approvals/reject/${approvalId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({ rejectionReason }),
    })
    return res.json()
  },

  getEventApprovalStatus: async (eventId: number) => {
    const res = await fetch(`${API_BASE_URL}/approvals/event/${eventId}`, {
      method: 'GET',
      headers: headers(),
    })
    return res.json()
  },
}

// ============ ADMIN APIs ============

export const adminApi = {
  getPendingOrganizers: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/organizers/pending`, {
      method: 'GET',
      headers: headers(true),
    })
    return res.json()
  },

  approveOrganizer: async (organizerId: number) => {
    const res = await fetch(`${API_BASE_URL}/admin/organizers/approve/${organizerId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({}),
    })
    return res.json()
  },

  rejectOrganizer: async (organizerId: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/admin/organizers/reject/${organizerId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify({ reason }),
    })
    return res.json()
  },
}