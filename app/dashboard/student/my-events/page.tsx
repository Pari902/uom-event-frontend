'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { MyEventsPage } from '@/components/my-events-page'
import { LayoutDashboard, Ticket, Calendar, User } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
  { label: 'My Events', href: '/dashboard/student/my-events', icon: Ticket },
  { label: 'My Attendance', href: '/dashboard/student/attendance', icon: Calendar },
  { label: 'Profile', href: '/dashboard/student/profile', icon: User },
]

export default function StudentMyEventsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.role !== 'student') {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== 'student') {
    return null
  }

  return (
    <DashboardLayout navItems={navItems} title="Student Dashboard">
      <MyEventsPage />
    </DashboardLayout>
  )
}
