export type InvoiceItem = {
  description: string
  qty: number
  price: number
}

export type Invoice = {
  id?: string
  number: string
  client: string
  items: InvoiceItem[]
  total: number
}
