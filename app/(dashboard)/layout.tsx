'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout, fetchWithAuth } from '@/lib/auth/token-helpers'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    loadUser()
  }, [])
  
  const loadUser = async () => {
    try {
      const response = await fetchWithAuth('/api/auth/me')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setUser(result.data)
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }
  
  const handleLogout = () => {
    logout()
  }
  
  const getUserInitials = () => {
    if (!user) return 'OR'
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/invoices', label: 'Invoices', icon: '📄' },
  ]
  
  return (
    <div className="min-h-screen bg-dark">
      {/* Main Container with max-width */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Top Navigation Bar - Contained within max-width */}
        <nav className="glass-panel rounded-xl border border-white/10 mb-6 backdrop-blur-xl bg-white/5">
          <div className="relative flex items-center justify-center px-6 h-16">
            {/* Left: Company Name with theme color */}
            <div className="absolute left-6">
              <Link href="/dashboard" className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-cyan-600 text-transparent bg-clip-text">
                Oryxa
              </Link>
            </div>
            
            {/* Center: Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-slate-400 hover:text-primary-400 hover:bg-white/5'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
            
            {/* Right: User Profile & Logout */}
            <div className="absolute right-6 flex items-center space-x-3">
              {/* User Profile */}
              <div className="flex items-center space-x-3 glass-panel px-3 py-1.5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{getUserInitials()}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-400">{user?.email || 'admin@oryxa.com'}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  )
}
