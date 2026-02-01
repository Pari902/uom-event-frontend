'use client'

import { useState } from 'react'
import {
    LayoutDashboard,
    Users,
    Calendar,
    Settings,
    Activity,
    BarChart,
    FileText,
    Search,
    Filter,
    Download,
    MoreHorizontal,
    Shield,
    UserCheck,
    UserX,
    RefreshCw,
    TrendingUp,
    Briefcase
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/auth-context'
import { mockUsers, mockEvents, mockActivityLog, mockReports, mockOrganizerApplications } from '@/lib/mock-data'
import {
    BarChart as RechartsBarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts'

const navItems = [
    { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { label: 'Reports', href: '/dashboard/admin/reports', icon: FileText },
]

export interface AdminDashboardProps {
    view?: 'overview' | 'users' | 'reports'
}

export function AdminDashboard({ view = 'overview' }: AdminDashboardProps) {
    const { user } = useAuth()
    const [userSearch, setUserSearch] = useState('')
    const [userRoleFilter, setUserRoleFilter] = useState('all')

    // Metrics
    const totalUsers = mockUsers.length
    const totalEvents = mockEvents.length
    const activeRegistrations = mockEvents.reduce((acc, curr) => acc + curr.registeredCount, 0)
    const systemHealth = 98.5

    // User Management Logic
    const filteredUsers = mockUsers.filter((u) => {
        const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase())
        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
        return matchesSearch && matchesRole
    })

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700'
            case 'dean': return 'bg-indigo-100 text-indigo-700'
            case 'vice_chancellor': return 'bg-rose-100 text-rose-700'
            case 'treasurer': return 'bg-amber-100 text-amber-700'
            case 'venue_manager': return 'bg-cyan-100 text-cyan-700'
            case 'organizer': return 'bg-blue-100 text-blue-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    // Chart Data
    const eventStatsData = [
        { name: 'Approved', value: mockEvents.filter(e => e.status === 'approved').length },
        { name: 'Pending', value: mockEvents.filter(e => e.status === 'pending_approval' || e.status === 'pending_venue').length },
        { name: 'Draft', value: mockEvents.filter(e => e.status === 'draft').length },
        { name: 'Rejected', value: mockEvents.filter(e => e.status === 'rejected').length },
    ]
    const PIE_COLORS = ['#10b981', '#f59e0b', '#6b7280', '#ef4444']

    const registrationTrendData = [
        { name: 'Jan', students: 120 },
        { name: 'Feb', students: 250 },
        { name: 'Mar', students: 450 },
        { name: 'Apr', students: 300 },
        { name: 'May', students: 200 },
        { name: 'Jun', students: 180 },
    ]

    const topDepartmentsData = [
        { name: 'CSE', engagement: 85 },
        { name: 'ENTC', engagement: 72 },
        { name: 'Civil', engagement: 65 },
        { name: 'Mech', engagement: 60 },
        { name: 'IT', engagement: 55 },
    ]

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'success': return <div className="h-2 w-2 rounded-full bg-green-500" />
            case 'warning': return <div className="h-2 w-2 rounded-full bg-yellow-500" />
            case 'error': return <div className="h-2 w-2 rounded-full bg-red-500" />
            default: return <div className="h-2 w-2 rounded-full bg-blue-500" />
        }
    }

    return (
        <DashboardLayout navItems={navItems} title="System Administration">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Welcome back, Admin!</h1>
                <p className="text-muted-foreground">Manage users, system settings, and view reports</p>
            </div>

            <div className="space-y-6">
                {/* OVERVIEW TAB */}
                {view === 'overview' && (
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0">
                                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <div className="text-2xl font-bold">{totalUsers}</div>
                                        <span className="text-xs text-green-600">+12% from last month</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0">
                                        <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <div className="text-2xl font-bold">{totalEvents}</div>
                                        <span className="text-xs text-green-600">+5 new this week</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0">
                                        <p className="text-sm font-medium text-muted-foreground">Active Registrations</p>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <div className="text-2xl font-bold">{activeRegistrations}</div>
                                        <span className="text-xs text-green-600">+8% growth</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0">
                                        <p className="text-sm font-medium text-muted-foreground">System Health</p>
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-baseline space-x-2">
                                        <div className="text-2xl font-bold">{systemHealth}%</div>
                                        <span className="text-xs text-green-600">All systems operational</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            {/* Main Content Area (Charts) */}
                            <div className="space-y-6 md:col-span-4">
                                {/* User Registration Trend */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            User Registration Trend
                                        </CardTitle>
                                        <CardDescription>New student registrations over the last 6 months</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={registrationTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis axisLine={false} tickLine={false} />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="students" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Top Departments */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Briefcase className="h-5 w-5" />
                                            Top Engaged Departments
                                        </CardTitle>
                                        <CardDescription>Based on event participation and organization</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RechartsBarChart data={topDepartmentsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                                    <Bar dataKey="engagement" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                                </RechartsBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Area (Activity & Event Stats) */}
                            <div className="space-y-6 md:col-span-3">
                                {/* Event Statistics */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart className="h-5 w-5" />
                                            Event Statistics
                                        </CardTitle>
                                        <CardDescription>Current status of all events</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={eventStatsData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {eventStatsData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Activity Log */}
                                <Card className="h-fit">
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Real-time system updates</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {mockActivityLog.slice(0, 6).map((log) => (
                                                <div key={log.id} className="relative flex gap-4 pb-4 last:pb-0 border-l border-border pl-6 last:border-0 ml-2">
                                                    <span className="absolute -left-[5px] top-1">
                                                        {getActivityIcon(log.type)}
                                                    </span>
                                                    <div className="grid gap-1">
                                                        <p className="text-sm font-medium leading-none">{log.action}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <span className="font-semibold text-foreground">{log.user}</span> • {log.timestamp}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* USER MANAGEMENT TAB */}
                {view === 'users' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Directory</CardTitle>
                                <CardDescription>Manage user roles, statuses, and permissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
                                            className="pl-9"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Roles</SelectItem>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="organizer">Organizer</SelectItem>
                                            <SelectItem value="venue_manager">Venue Manager</SelectItem>
                                            <SelectItem value="treasurer">Treasurer</SelectItem>
                                            <SelectItem value="dean">Dean</SelectItem>
                                            <SelectItem value="vice_chancellor">Vice Chancellor</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Department</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.map((u) => (
                                                <TableRow key={u.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{u.name}</div>
                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`border-0 ${getRoleBadgeColor(u.role)}`}>
                                                            {u.role.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{u.department || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={u.status === 'active' ? 'default' : 'secondary'}>
                                                            {u.status || 'Active'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem>
                                                                    <UserCheck className="mr-2 h-4 w-4" /> Edit Role
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem>
                                                                    <RefreshCw className="mr-2 h-4 w-4" /> Reset Password
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-red-600">
                                                                    <UserX className="mr-2 h-4 w-4" /> Deactivate User
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organizer Approval Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Organizer Applications</CardTitle>
                                <CardDescription>Review requests for organizer privileges</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockOrganizerApplications.map((app) => (
                                        <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div>
                                                <h4 className="font-semibold">{app.name}</h4>
                                                <p className="text-sm text-muted-foreground">{app.department} • {app.email}</p>
                                                <p className="mt-1 text-sm italic">"{app.reason}"</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline">Reject</Button>
                                                <Button size="sm">Approve</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* REPORTS TAB */}
                {view === 'reports' && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Generate Reports</CardTitle>
                                <CardDescription>Export system data for analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Report Type</label>
                                        <Select defaultValue="user">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">User Report</SelectItem>
                                                <SelectItem value="event">Event Report</SelectItem>
                                                <SelectItem value="financial">Financial Report</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date Range</label>
                                        <Select defaultValue="month">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select range" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="week">Last 7 Days</SelectItem>
                                                <SelectItem value="month">Last 30 Days</SelectItem>
                                                <SelectItem value="year">Last Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Format</label>
                                        <Select defaultValue="pdf">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF Document</SelectItem>
                                                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                                                <SelectItem value="csv">CSV File</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-end">
                                        <Button className="w-full">
                                            <Download className="mr-2 h-4 w-4" /> Generate Report
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Reports</CardTitle>
                                <CardDescription>Previously generated reports available for download</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Report Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Date Generated</TableHead>
                                                <TableHead>Format</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {mockReports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell className="font-medium">{report.name}</TableCell>
                                                    <TableCell>{report.type}</TableCell>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{report.format}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}
