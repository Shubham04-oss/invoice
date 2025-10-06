'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/auth/token-helpers';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string | null;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  items: InvoiceItem[];
}

interface InvoiceDetailProps {
  invoiceId: string;
}

export default function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load invoice');
      }

      const data = await response.json();
      setInvoice(data.invoice);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      router.push('/dashboard/invoices');
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
      setDeleteLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetchWithAuth(`/api/invoices/${invoiceId}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber || invoiceId}.pdf`;
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
      month: 'long',
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
          <div className="text-gray-400">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-red-500/30 backdrop-blur-xl bg-red-500/5">
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadInvoice}
          className="mt-2 text-red-400 hover:text-red-300 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="glass-panel rounded-xl p-12 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="text-center">
          <p className="text-gray-400">Invoice not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl px-12 py-16 border border-white/10 backdrop-blur-xl bg-white/5 max-w-7xl mx-auto min-h-[1200px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Invoice {invoice.invoiceNumber}
          </h1>
          <span
            className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusBadgeClass(
              invoice.status
            )}`}
          >
            {invoice.status}
          </span>
        </div>
        <div className="space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 glass-panel border border-green-500/30 text-green-400 hover:border-green-500/50 hover:bg-green-500/10 rounded-lg transition-all backdrop-blur-md"
          >
            Download PDF
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="px-4 py-2 glass-panel border border-red-500/30 text-red-400 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg transition-all backdrop-blur-md disabled:opacity-50"
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Main content area with flex-grow */}
      <div className="flex-grow flex flex-col">
        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Bill To:</h2>
          <p className="text-white font-medium">{invoice.clientName}</p>
          <p className="text-gray-400">{invoice.clientEmail}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <span className="text-gray-400">Issue Date: </span>
            <span className="text-white font-medium">
              {formatDate(invoice.issueDate)}
            </span>
          </div>
          {/* Only show due date if it's different from issue date */}
          {new Date(invoice.issueDate).toDateString() !== new Date(invoice.dueDate).toDateString() && (
            <div>
              <span className="text-gray-400">Due Date: </span>
              <span className="text-white font-medium">
                {formatDate(invoice.dueDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-16">
        <h2 className="text-lg font-semibold text-white mb-6">Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="px-6 py-4 text-sm text-white">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-white text-right">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-white text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-sm text-white text-right font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      {/* Spacer to push totals to bottom */}
      <div className="flex-grow"></div>

      {/* Totals - Fixed at bottom */}
      <div className="flex justify-end mb-0 mt-auto">
        <div className="w-80 glass-panel rounded-lg p-8 border border-white/10 backdrop-blur-md bg-white/5">
          <div className="flex justify-between py-4 border-b border-white/10">
            <span className="text-gray-400 text-base">Subtotal:</span>
            <span className="text-white font-semibold text-base">
              {formatCurrency(invoice.subtotal)}
            </span>
          </div>
          <div className="flex justify-between py-4 border-b border-white/10">
            <span className="text-gray-400 text-base">Tax:</span>
            <span className="text-white font-semibold text-base">
              {formatCurrency(Number(invoice.tax))}
            </span>
          </div>
          <div className="flex justify-between py-5 border-t border-cyan-500/30 mt-3">
            <span className="text-xl font-bold text-white">Total:</span>
            <span className="text-xl font-bold text-cyan-400">
              {formatCurrency(invoice.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
