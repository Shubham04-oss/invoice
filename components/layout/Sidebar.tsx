'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout, fetchWithAuth } from '@/lib/auth/token-helpers'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export default function Sidebar() {
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
  
  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/invoices', label: 'Invoices', icon: '📄' },
    { href: '/dashboard/invoices/new', label: 'New Invoice', icon: '➕' },
  ]
  
  const getUserInitials = () => {
    if (!user) return 'U'
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  
  const getUserDisplayName = () => {
    if (!user) return 'User Name'
    return `${user.firstName} ${user.lastName}`
  }
  
  return (
    <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6">
      <div className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      
      {/* User section at bottom */}
      <div className="mt-auto pt-6 border-t border-white/10">
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-navy-900 font-bold">{getUserInitials()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{getUserDisplayName()}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="mt-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}
