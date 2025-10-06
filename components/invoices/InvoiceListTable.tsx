'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth/token-helpers';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

export default function InvoiceListTable() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchWithAuth('/api/invoices');
      
      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      setDeleteLoading(id);
      const response = await fetchWithAuth(`/api/invoices/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      // Reload invoices after deletion
      await loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await fetchWithAuth(`/api/invoices/${id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-xl p-12 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="flex justify-center items-center">
          <div className="text-gray-400">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-red-500/30 backdrop-blur-xl bg-red-500/5">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadInvoices}
          className="mt-2 text-red-400 hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-12 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No invoices found</p>
          <button
            onClick={() => router.push('/dashboard/invoices/new')}
            className="px-4 py-2 glass-panel border border-cyan-500/30 text-cyan-400 hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-lg transition-all backdrop-blur-md"
          >
            Create your first invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Issue Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-400">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {invoice.clientName}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-white">
                  {formatCurrency(Number(invoice.total))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(invoice.issueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    PDF
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    disabled={deleteLoading === invoice.id}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading === invoice.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
