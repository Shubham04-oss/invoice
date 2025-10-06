'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { saveToken } from '@/lib/auth/token-helpers'

export default function RegisterForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    tenantName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError(null)
  }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (loading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      
      // Hard redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'An error occurred during registration')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            First Name
          </label>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="John"
            required
            disabled={loading}
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Last Name
          </label>
          <Input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Doe"
            required
            disabled={loading}
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Email Address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="john@company.com"
          required
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="tenantName" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Company Name
        </label>
        <Input
          id="tenantName"
          name="tenantName"
          type="text"
          value={formData.tenantName}
          onChange={handleChange}
          placeholder="Your Company Inc"
          required
          disabled={loading}
        />
      </div>
      
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          required
          minLength={8}
          disabled={loading}
        />
      </div>
      
      <Button 
        type="submit" 
        variant="primary" 
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  )
}
