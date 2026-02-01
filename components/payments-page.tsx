'use client'

import { useState, useMemo } from 'react'
import {
  CreditCard,
  Search,
  Filter,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { mockEvents, mockPaymentVerifications } from '@/lib/mock-data'
import type { PaymentVerification } from '@/lib/types'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function PaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentVerification[]>(mockPaymentVerifications)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentVerification | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Get payments for organizer's events
  const myEvents = useMemo(() => {
    return mockEvents.filter((e) => e.organizerId === user?.id)
  }, [user?.id])

  const myPayments = useMemo(() => {
    const myEventIds = myEvents.map((e) => e.id)
    return payments.filter((p) => myEventIds.includes(p.eventId))
  }, [myEvents, payments])

  const pendingPayments = useMemo(() => {
    return myPayments.filter((p) => p.status === 'pending')
  }, [myPayments])

  const approvedPayments = useMemo(() => {
    return myPayments.filter((p) => p.status === 'approved')
  }, [myPayments])

  const rejectedPayments = useMemo(() => {
    return myPayments.filter((p) => p.status === 'rejected')
  }, [myPayments])

  const getFilteredPayments = (status: string) => {
    let filtered = status === 'pending' ? pendingPayments :
                   status === 'approved' ? approvedPayments : rejectedPayments
    
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.studentIndex.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  }

  const handleViewSlip = (payment: PaymentVerification) => {
    setSelectedPayment(payment)
    setShowSlipModal(true)
  }

  const handleApprove = (paymentId: string) => {
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, status: 'approved' as const } : p
      )
    )
    setShowSlipModal(false)
  }

  const openRejectModal = (payment: PaymentVerification) => {
    setSelectedPayment(payment)
    setShowRejectModal(true)
    setShowSlipModal(false)
  }

  const handleReject = () => {
    if (!selectedPayment || !rejectReason) return
    setPayments(
      payments.map((p) =>
        p.id === selectedPayment.id
          ? { ...p, status: 'rejected' as const, rejectionReason: rejectReason }
          : p
      )
    )
    setShowRejectModal(false)
    setRejectReason('')
    setSelectedPayment(null)
  }

  // Stats
  const totalAmount = myPayments
    .filter((p) => p.status === 'approved')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payment Verification</h1>
        <p className="text-muted-foreground">Review and verify payment slips from registered students</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{pendingPayments.length}</p>
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">{approvedPayments.length}</p>
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
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">{rejectedPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-foreground">Rs. {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by student name, index, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            Pending
            {pendingPayments.length > 0 && (
              <span className="ml-2 rounded-full bg-warning px-2 py-0.5 text-xs text-warning-foreground">
                {pendingPayments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map((status) => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {getFilteredPayments(status).length === 0 ? (
                <Card className="p-8 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium text-foreground">
                    No {status} payments
                  </p>
                  <p className="text-muted-foreground">
                    {status === 'pending'
                      ? 'All payment verifications are up to date'
                      : `${status.charAt(0).toUpperCase() + status.slice(1)} payments will appear here`}
                  </p>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Event
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Amount
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Transaction Ref
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredPayments(status).map((payment) => (
                            <tr key={payment.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-medium text-foreground">{payment.studentName}</p>
                                  <p className="text-sm text-muted-foreground">{payment.studentIndex}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-foreground">{payment.eventName}</td>
                              <td className="px-4 py-4 font-medium text-foreground">
                                Rs. {payment.amount.toLocaleString()}
                              </td>
                              <td className="px-4 py-4 text-muted-foreground">
                                {payment.transactionRef || '-'}
                              </td>
                              <td className="px-4 py-4 text-muted-foreground">
                                {new Date(payment.uploadedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[payment.status]}`}>
                                  {payment.status}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewSlip(payment)}
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    View
                                  </Button>
                                  {status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-success text-success-foreground hover:bg-success/90"
                                        onClick={() => handleApprove(payment.id)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openRejectModal(payment)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* View Slip Modal */}
      <Dialog open={showSlipModal} onOpenChange={setShowSlipModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
            <DialogDescription>Review the uploaded payment slip</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium text-foreground">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Index Number</p>
                  <p className="font-medium text-foreground">{selectedPayment.studentIndex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Event</p>
                  <p className="font-medium text-foreground">{selectedPayment.eventName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground">Rs. {selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transaction Ref</p>
                  <p className="font-medium text-foreground">{selectedPayment.transactionRef || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedPayment.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Payment Slip Image Placeholder */}
              <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Payment Slip Image</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.slipUrl}</p>
                </div>
              </div>

              {selectedPayment.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openRejectModal(selectedPayment)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => handleApprove(selectedPayment.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="font-medium text-foreground">{selectedPayment.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.eventName} - Rs. {selectedPayment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <Label htmlFor="reject-reason">Rejection Reason</Label>
                <Textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Bank slip is blurry, amount doesn't match, etc."
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectReason}
                >
                  Reject Payment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
