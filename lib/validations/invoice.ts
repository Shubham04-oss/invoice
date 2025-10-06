import { z } from 'zod'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
})

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid client email'),
  clientAddress: z.string().optional(),
  issueDate: z.string().or(z.date()),
  dueDate: z.string().or(z.date()),
  tax: z.number().min(0, 'Tax must be positive').default(0),
  notes: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']).default('draft'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
