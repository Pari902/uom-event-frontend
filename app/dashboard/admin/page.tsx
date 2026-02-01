'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AdminDashboard } from '@/components/admin-dashboard'

export default function AdminDashboardPage() {
    const { user, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
        } else if (user?.role !== 'admin') {
            router.push('/login')
        }
    }, [isAuthenticated, user, router])

    if (!isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        )
    }

    return <AdminDashboard view="overview" />
}
