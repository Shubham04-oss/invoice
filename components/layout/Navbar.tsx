'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Button from '../ui/Button'
import { logout } from '@/lib/auth/token-helpers'

export default function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Check if user is on a protected route (dashboard)
  // If they're on dashboard routes, they must be authenticated (middleware ensures this)
  const isProtectedRoute = pathname.startsWith('/dashboard')
  
  const handleLogout = () => {
    logout()
  }
  
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/invoices', label: 'Invoices' },
  ]
  
  return (
    <nav className="nav-wrapper">
      <div className="max-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">O</span>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Oryxa InvoiceFlow
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  pathname === link.href 
                    ? 'bg-primary-500/10 text-primary-400' 
                    : 'text-slate-400 hover:text-primary-400 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Placeholder */}
            <button className="w-9 h-9 rounded-lg glass-panel flex items-center justify-center hover:bg-white/10 transition-all">
              <span className="text-lg">☀️</span>
            </button>
            
            {mounted && (
              <>
                {isProtectedRoute ? (
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                ) : (
                  <>
                    <Link href="/auth/login" className="hidden sm:block">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    
                    <Link href="/register">
                      <Button variant="primary" size="sm">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
