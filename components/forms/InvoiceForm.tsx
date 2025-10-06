'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { fetchWithAuth } from '@/lib/auth/token-helpers'

interface InvoiceItem {
  description: string
  quantity: number
  baseAmount: number  // Can be entered or auto-calculated
  totalAmount: number  // User enters this (total including tax)
  gstPercent: number
  sgstPercent: number
  cgstPercent: number
  unitPrice: number  // Calculated from baseAmount / quantity
}

interface InvoiceFormProps {
  invoice?: any // For edit mode
  mode?: 'create' | 'edit'
}

export default function InvoiceForm({ invoice, mode = 'create' }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Helper function to limit decimal places to 2
  const limitDecimalPlaces = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement
    const v = target.value
    if (v.includes('.')) {
      const parts = v.split('.')
      if (parts[1] && parts[1].length > 2) {
        // Truncate extra decimals while typing to avoid jumpy rounding
        target.value = `${parts[0]}.${parts[1].slice(0, 2)}`
      }
    }
  }

  const roundToTwo = (v: string | number | undefined | null) => {
    const n = Number(v) || 0
    return Math.round(n * 100) / 100
  }
  
  const todayDate = new Date().toISOString().split('T')[0]
  
  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || '',
    clientName: invoice?.clientName || '',
    clientEmail: invoice?.clientEmail || '',
    clientAddress: invoice?.clientAddress || '',
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : todayDate,
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : todayDate,
    gstPercent: invoice?.gstPercent || 0,
    sgstPercent: invoice?.sgstPercent || 0,
    cgstPercent: invoice?.cgstPercent || 0,
    shippingCharges: invoice?.shippingCharges || 0,
    discountPercent: invoice?.discountPercent || 0,
    status: invoice?.status || 'draft',
    notes: invoice?.notes || 'Paid Online',
  })
  
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items?.length > 0
      ? invoice.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          baseAmount: item.baseAmount || 0,
          totalAmount: item.totalAmount || 0,
          gstPercent: item.gstPercent || 0,
          sgstPercent: item.sgstPercent || 0,
          cgstPercent: item.cgstPercent || 0,
          unitPrice: parseFloat(item.unitPrice),
        }))
      : [{ description: '', quantity: 1, baseAmount: 0, totalAmount: 0, gstPercent: 0, sgstPercent: 0, cgstPercent: 0, unitPrice: 0 }]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      // When issue date changes, also update due date to match
      if (name === 'issueDate') {
        return { ...prev, [name]: value, dueDate: value }
      }

      // For monetary/percent fields, store rounded values
      if (name === 'shippingCharges' || name === 'discountPercent') {
        return { ...prev, [name]: roundToTwo(value) }
      }

      return { ...prev, [name]: value }
    })
    setError(null)
  }

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => {
      const newItems = [...prev]

      // Normalize incoming value
      let normalized: any = value
      if (field === 'quantity') normalized = Number(value) || 0
      // For monetary and percent fields, round to 2 decimals
      else if (['baseAmount', 'totalAmount', 'unitPrice', 'gstPercent', 'sgstPercent', 'cgstPercent'].includes(field as string)) {
        normalized = roundToTwo(value)
      }

      newItems[index] = { ...newItems[index], [field]: normalized }

      const item = newItems[index]
      const totalTaxPercent = Number(item.gstPercent) + Number(item.sgstPercent) + Number(item.cgstPercent)
      const quantity = Number(item.quantity) || 1

      // If totalAmount or tax percentages change, auto-update baseAmount
      if (field === 'totalAmount' || field === 'gstPercent' || field === 'sgstPercent' || field === 'cgstPercent') {
        const totalAmount = Number(item.totalAmount) || 0
        const baseAmount = totalAmount / (1 + totalTaxPercent / 100)
        newItems[index].baseAmount = roundToTwo(baseAmount || 0)
        newItems[index].unitPrice = roundToTwo((baseAmount || 0) / quantity)
      }
      // If baseAmount changes, recalculate unitPrice and optionally totalAmount
      else if (field === 'baseAmount') {
        const baseAmount = Number(item.baseAmount) || 0
        newItems[index].unitPrice = roundToTwo(baseAmount / quantity || 0)
        // Auto-update totalAmount based on new baseAmount
        const totalAmount = baseAmount * (1 + totalTaxPercent / 100)
        newItems[index].totalAmount = roundToTwo(totalAmount || 0)
      }
      // If quantity changes, recalculate unitPrice
      else if (field === 'quantity') {
        const baseAmount = Number(item.baseAmount) || 0
        newItems[index].unitPrice = roundToTwo(baseAmount / quantity || 0)
      }

      return newItems
    })
  }

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, baseAmount: 0, totalAmount: 0, gstPercent: 0, sgstPercent: 0, cgstPercent: 0, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (Number(item.unitPrice) * Number(item.quantity))
    }, 0)
  }

  const calculateItemTax = (item: InvoiceItem) => {
    const baseAmount = Number(item.unitPrice) * Number(item.quantity)
    const totalTaxPercent = Number(item.gstPercent) + Number(item.sgstPercent) + Number(item.cgstPercent)
    return (baseAmount * totalTaxPercent) / 100
  }

  const calculateTotalItemTax = () => {
    return items.reduce((sum, item) => sum + calculateItemTax(item), 0)
  }

  const calculateTaxAmount = () => {
    // Tax from items only (no global tax)
    return calculateTotalItemTax()
  }

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal()
    return (subtotal * Number(formData.discountPercent)) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const taxAmount = calculateTaxAmount()
    const discountAmount = calculateDiscountAmount()
    const shipping = Number(formData.shippingCharges)
    return subtotal + taxAmount + shipping - discountAmount
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        ...formData,
        tax: roundToTwo(calculateTaxAmount()), // Calculate total tax from item percentages only
        gstPercent: 0,  // No global tax
        sgstPercent: 0,
        cgstPercent: 0,
        shippingCharges: roundToTwo(formData.shippingCharges),
        discountPercent: roundToTwo(formData.discountPercent),
        items: items.map(item => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: roundToTwo(item.unitPrice),
          baseAmount: roundToTwo(item.baseAmount),
          totalAmount: roundToTwo(item.totalAmount),
          gstPercent: roundToTwo(item.gstPercent),
          sgstPercent: roundToTwo(item.sgstPercent),
          cgstPercent: roundToTwo(item.cgstPercent),
        })),
      }
      
      let response
      if (mode === 'edit' && invoice) {
        response = await fetchWithAuth(`/api/invoices/${invoice.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetchWithAuth('/api/invoices', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${mode} invoice`)
      }
      
      // Redirect to invoices list
      router.push('/dashboard/invoices')
    } catch (err: any) {
      setError(err.message || `An error occurred while ${mode === 'edit' ? 'updating' : 'creating'} the invoice`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Basic Information */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Invoice Number <span className="text-red-400">*</span>
            </label>
            <Input
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="ORY-001"
              required
              disabled={loading || mode === 'edit'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input w-full"
              disabled={loading}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Issue Date <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              name="issueDate"
              value={formData.issueDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Due Date <span className="text-red-400">*</span>
            </label>
            <Input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>
      
      {/* Client Information */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Client Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Client Name <span className="text-red-400">*</span>
            </label>
            <Input
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="Acme Corporation"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Client Email <span className="text-red-400">*</span>
            </label>
            <Input
              type="email"
              name="clientEmail"
              value={formData.clientEmail}
              onChange={handleChange}
              placeholder="billing@acme.com"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Client Address
            </label>
            <textarea
              name="clientAddress"
              value={formData.clientAddress}
              onChange={handleChange}
              placeholder="123 Business Ave, City, State, ZIP"
              rows={3}
              className="input w-full"
              disabled={loading}
            />
          </div>
        </div>
      </div>
      
      {/* Line Items */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Line Items</h3>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 space-y-3">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <Input
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Service or product description"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="grid grid-cols-12 gap-3">
                {/* Quantity */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    min="1"
                    required
                    disabled={loading}
                  />
                </div>
                
                {/* Base Amount (without tax) */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Base Amount
                  </label>
                  <Input
                    type="number"
                    value={item.baseAmount || ''}
                    onChange={(e) => handleItemChange(index, 'baseAmount', Number(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    onInput={limitDecimalPlaces}
                    disabled={loading}
                    placeholder="Amount without tax"
                  />
                </div>
                
                {/* Unit Price (calculated) */}
                <div className="col-span-12 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Unit Price
                  </label>
                  <Input
                    type="number"
                    value={item.unitPrice || ''}
                    disabled
                    placeholder="Auto-calculated"
                    className="bg-white/5 border-white/10 text-white/60"
                  />
                </div>
              </div>

              {/* Tax Section - Separated */}
              <div className="grid grid-cols-12 gap-3 pt-3 border-t border-white/10">
                {/* GST % */}
                <div className="col-span-4 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    GST %
                  </label>
                  <Input
                    type="number"
                    value={item.gstPercent || ''}
                    onChange={(e) => handleItemChange(index, 'gstPercent', Number(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    onInput={limitDecimalPlaces}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
                
                {/* SGST % */}
                <div className="col-span-4 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    SGST %
                  </label>
                  <Input
                    type="number"
                    value={item.sgstPercent || ''}
                    onChange={(e) => handleItemChange(index, 'sgstPercent', Number(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    onInput={limitDecimalPlaces}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
                
                {/* CGST % */}
                <div className="col-span-4 md:col-span-4">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    CGST %
                  </label>
                  <Input
                    type="number"
                    value={item.cgstPercent || ''}
                    onChange={(e) => handleItemChange(index, 'cgstPercent', Number(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    onInput={limitDecimalPlaces}
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total Amount - Separated */}
              <div className="grid grid-cols-12 gap-3 pt-3 border-t border-white/10">
                <div className="col-span-12">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Total Amount (with tax)
                  </label>
                  <Input
                    type="number"
                    value={item.totalAmount || ''}
                    onChange={(e) => handleItemChange(index, 'totalAmount', Number(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    onInput={limitDecimalPlaces}
                    required
                    disabled={loading}
                    placeholder="Amount with tax"
                    className="text-lg font-semibold"
                  />
                </div>
              </div>
              
              {/* Remove button */}
              {items.length > 1 && (
                <div className="flex justify-end pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="px-3 py-1 text-sm text-red-400 hover:text-red-300 border border-red-400/30 rounded hover:border-red-400/50 transition-all"
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Add Item Button before totals */}
        <div className="mt-6 pb-4 border-b border-white/10">
          <Button type="button" variant="secondary" onClick={addItem} disabled={loading}>
            + Add Item
          </Button>
        </div>
        
        {/* Totals */}
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal (Base Amount):</span>
            <span className="text-white font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Tax (from items):</span>
            <span className="text-white font-semibold">₹{calculateTotalItemTax().toFixed(2)}</span>
          </div>
          
          {/* Shipping Charges */}
          <div className="flex justify-between items-center">
            <label style={{ color: 'var(--text-secondary)' }}>Shipping Charges:</label>
            <Input
              type="number"
              name="shippingCharges"
              value={formData.shippingCharges || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              onInput={limitDecimalPlaces}
              className="w-32 text-right"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
          
          {/* Discount */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label style={{ color: 'var(--text-secondary)' }}>Discount %:</label>
              <Input
                type="number"
                name="discountPercent"
                value={formData.discountPercent || ''}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.01"
                onInput={limitDecimalPlaces}
                placeholder="0"
                className="w-32"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Discount Amount: <span className="text-white">-₹{calculateDiscountAmount().toFixed(2)}</span></span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-lg font-bold border-t border-white/10 pt-3">
            <span className="text-white">Total:</span>
            <span className="text-primary-400">₹{calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      {/* Notes */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Additional Notes</h3>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Payment terms, thank you message, etc."
          rows={4}
          className="input w-full"
          disabled={loading}
        />
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
        >
          {loading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Invoice' : 'Create Invoice')}
        </Button>
      </div>
    </form>
  )
}
