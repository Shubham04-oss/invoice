'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { fetchWithAuth } from '@/lib/auth/token-helpers'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentInvoices, setRecentInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, invoicesRes] = await Promise.all([
        fetchWithAuth('/api/invoices/stats'),
        fetchWithAuth('/api/invoices')
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        setRecentInvoices(data.data?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      paid: 'badge-success',
      pending: 'badge-warning',
      overdue: 'badge-danger',
      draft: 'badge-info',
    }
    return badges[status.toLowerCase()] || 'badge-info'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section - In a block */}
      <div className="glass-panel rounded-xl p-8 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="space-y-6">
          <div className="inline-block">
            <div className="px-4 py-1.5 rounded-lg backdrop-blur-md" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <span className="text-xs font-semibold tracking-wider" style={{ color: 'rgb(6, 182, 212)' }}>CONTROL CENTER</span>
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4">
                <span className="text-white">Billing & Automation, </span>
                <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-transparent bg-clip-text">refined</span>
              </h1>
              <p className="text-gray-400 text-lg">Monitor pipeline health, track revenue, and activate automations—all from a single glass dashboard.</p>
            </div>
            <div>
              <Link href="/dashboard/invoices/new">
                <Button variant="primary" size="md">
                  <span className="mr-2">+</span> Create Invoice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                <span className="text-2xl">📄</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">TOTAL INVOICES</p>
                <p className="text-3xl font-bold text-white mb-1">{stats.counts.total}</p>
                <p className="text-sm text-cyan-400">{formatCurrency(stats.amounts.total)}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
                <span className="text-2xl">💰</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">TOTAL AMOUNT</p>
                <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.amounts.total)}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">PAID</p>
                <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.amounts.paid)}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'rgba(236, 72, 153, 0.15)' }}>
                <span className="text-2xl">⏳</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">PENDING</p>
                <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.amounts.pending)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Activity Section */}
      <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Latest Activity</h2>
            <p className="text-sm text-gray-400">Keep tabs on the freshest invoices your clients interacted with.</p>
          </div>
          <Link href="/dashboard/invoices">
            <button className="px-4 py-2 rounded-lg glass-panel border border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-sm font-medium transition-all backdrop-blur-md">Browse Invoices</button>
          </Link>
        </div>

        <div className="overflow-x-auto" style={{ minHeight: '320px' }}>
          {recentInvoices.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Invoice #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Client</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Issue Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/invoices/${invoice.id}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-white">{invoice.clientName}</td>
                    <td className="py-3 px-4 text-white font-semibold">{formatCurrency(Number(invoice.total))}</td>
                    <td className="py-3 px-4 text-gray-400">{formatDate(invoice.issueDate)}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <button className="text-gray-400 hover:text-cyan-400 transition-colors">View →</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center text-gray-400" style={{ minHeight: '320px' }}>
              <div className="text-center">
                <p className="mb-4">No invoices yet.</p>
                <Link href="/dashboard/invoices/new">
                  <Button variant="primary">Create your first invoice</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
