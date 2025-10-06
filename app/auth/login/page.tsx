'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }
      
      // Hard redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Image 
              src="/oryxa-o-logo.png" 
              alt="Oryxa Logo" 
              width={64} 
              height={64}
              className="animate-pulse"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome to Oryxa InvoiceFlow
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your control center
          </p>
        </div>

        {/* Login Form */}
        <Card variant="panel" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Remember me
                </span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Sign Up Link */}
        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link href="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}