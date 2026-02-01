'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Users, CheckCircle, Shield, Menu, X, GraduationCap, Sparkles, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Calendar,
    title: 'Event Discovery',
    description: 'Browse and discover academic, cultural, sports, and entertainment events happening at the university.',
  },
  {
    icon: Users,
    title: 'Easy Registration',
    description: 'Register for events with a single click. Supports both free and paid event registrations.',
  },
  {
    icon: CheckCircle,
    title: 'QR-Based Entry',
    description: 'Get your unique QR code upon registration for quick and contactless event check-in.',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Upload bank deposit slips securely with automated verification by event organizers.',
  },
]

const upcomingEvents = [
  {
    name: 'AI & Machine Learning Workshop',
    date: 'Feb 15, 2026',
    venue: 'Senate Hall',
    category: 'Academic',
    isFree: true,
  },
  {
    name: 'Mora Night 2026',
    date: 'Mar 20, 2026',
    venue: 'University Grounds',
    category: 'Entertainment',
    isFree: false,
  },
  {
    name: 'Inter-Faculty Cricket Tournament',
    date: 'Feb 28, 2026',
    venue: 'Cricket Ground',
    category: 'Sports',
    isFree: true,
  },
]

const stats = [
  { value: '50+', label: 'Events per Year' },
  { value: '10,000+', label: 'Students' },
  { value: '100+', label: 'Organizers' },
  { value: '20+', label: 'Venues' },
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">UoM Events</span>
                <p className="text-xs text-muted-foreground">University of Moratuwa</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Features
              </a>
              <a href="#events" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Events
              </a>
              <a href="#about" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                About
              </a>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="space-y-1 px-4 py-3">
              <a href="#features" className="block py-2 text-sm font-medium text-muted-foreground">
                Features
              </a>
              <a href="#events" className="block py-2 text-sm font-medium text-muted-foreground">
                Events
              </a>
              <a href="#about" className="block py-2 text-sm font-medium text-muted-foreground">
                About
              </a>
              <Link href="/login" className="block pt-2">
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Welcome to the official event platform</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              University of Moratuwa
              <span className="block text-primary">Event Management System</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Discover, register, and participate in academic seminars, cultural festivals, sports tournaments, 
              and entertainment events. Your gateway to campus life at UoM.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <a href="#events">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  Browse Events
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A comprehensive platform designed to streamline event management for students, organizers, and administrators.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section id="events" className="bg-muted py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Upcoming Events</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Don&apos;t miss out on these exciting events happening soon at the university.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.name} className="overflow-hidden border-border bg-card transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {event.category}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      event.isFree 
                        ? 'bg-success/10 text-success' 
                        : 'bg-accent/10 text-accent-foreground'
                    }`}>
                      {event.isFree ? 'Free' : 'Paid'}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-foreground">{event.name}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/login">
              <Button variant="outline">Sign In to Register</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground">About UoM Events</h2>
              <p className="mt-4 text-muted-foreground">
                The University of Moratuwa Event Management System is designed to bring together 
                students, faculty, and staff through a seamless event experience. From academic 
                workshops to entertainment nights, our platform makes it easy to discover, register, 
                and participate in all campus events.
              </p>
              <p className="mt-4 text-muted-foreground">
                For event organizers, we provide powerful tools to create events, manage registrations, 
                verify payments, and analyze attendance. Our multi-tier approval system ensures all 
                events meet university standards.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-2xl font-bold text-primary">For Students</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse events, register easily, and get QR tickets
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-2xl font-bold text-primary">For Organizers</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create events, manage payments, track attendance
                  </p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <GraduationCap className="h-24 w-24 text-primary" />
                  <p className="mt-6 text-2xl font-bold text-foreground">University of Moratuwa</p>
                  <p className="mt-2 text-muted-foreground">Excellence in Engineering Education Since 1972</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-foreground">Ready to Get Started?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            Sign in with your university credentials to start exploring events and make the most of your campus life.
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button size="lg" variant="secondary">
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">UoM Events</span>
                <p className="text-xs text-muted-foreground">University of Moratuwa</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} University of Moratuwa. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
