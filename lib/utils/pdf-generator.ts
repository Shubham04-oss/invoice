import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

interface Invoice {
  invoiceNumber: string
  clientName: string
  clientEmail: string
  clientAddress?: string | null
  issueDate: Date
  dueDate: Date
  subtotal: number
  tax: number
  total: number
  notes?: string | null
  status: string
  items: InvoiceItem[]
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

export async function generatePdfForInvoice(invoice: Invoice): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage([595, 842]) // A4 size
  let { width, height } = page.getSize()
  
  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  // Colors
  const primaryColor = rgb(0.231, 0.510, 0.965) // #3b82f6 (blue)
  const accentColor = rgb(0.078, 0.722, 0.651) // #14b8a6 (teal)
  const darkColor = rgb(0.012, 0.027, 0.090) // #020617 (navy)
  const grayColor = rgb(0.4, 0.4, 0.4)
  const blackColor = rgb(0, 0, 0)
  
  let yPosition = height - 60
  
  // Header - Oryxa InvoiceFlow Branding
  page.drawText('Oryxa InvoiceFlow', {
    x: 50,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: primaryColor,
  })
  
  // Invoice Title
  page.drawText('INVOICE', {
    x: width - 150,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: darkColor,
  })
  
  yPosition -= 50
  
  // Invoice Number and Date
  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
    x: width - 200,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: blackColor,
  })
  
  yPosition -= 20
  
  page.drawText(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, {
    x: width - 200,
    y: yPosition,
    size: 10,
    font: font,
    color: grayColor,
  })
  
  yPosition -= 15
  
  // Only show due date if it's different from issue date
  const issueDate = new Date(invoice.issueDate).toDateString()
  const dueDate = new Date(invoice.dueDate).toDateString()
  
  if (issueDate !== dueDate) {
    page.drawText(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
      x: width - 200,
      y: yPosition,
      size: 10,
      font: font,
      color: grayColor,
    })
    yPosition -= 15
  }
  
  // Status badge
  yPosition -= 5
  const statusColors: Record<string, typeof primaryColor> = {
    paid: rgb(0.133, 0.545, 0.133),
    sent: primaryColor,
    draft: grayColor,
    overdue: rgb(0.863, 0.078, 0.235),
  }
  
  page.drawText(`Status: ${invoice.status.toUpperCase()}`, {
    x: width - 200,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: statusColors[invoice.status] || grayColor,
  })
  
  yPosition -= 60
  
  // Bill To Section
  page.drawText('BILL TO:', {
    x: 50,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: primaryColor,
  })
  
  yPosition -= 20
  
  page.drawText(invoice.clientName, {
    x: 50,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: blackColor,
  })
  
  yPosition -= 18
  
  page.drawText(invoice.clientEmail, {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
    color: grayColor,
  })
  
  if (invoice.clientAddress) {
    yPosition -= 15
    page.drawText(invoice.clientAddress, {
      x: 50,
      y: yPosition,
      size: 10,
      font: font,
      color: grayColor,
    })
  }
  
  yPosition -= 40
  
  // Line separator
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: primaryColor,
  })
  
  yPosition -= 30
  
  // Table Header
  page.drawRectangle({
    x: 50,
    y: yPosition - 20,
    width: width - 100,
    height: 25,
    color: rgb(0.95, 0.97, 1), // Light blue background
  })
  
  page.drawText('DESCRIPTION', {
    x: 60,
    y: yPosition - 15,
    size: 10,
    font: fontBold,
    color: darkColor,
  })
  
  page.drawText('QTY', {
    x: width - 240,
    y: yPosition - 15,
    size: 10,
    font: fontBold,
    color: darkColor,
  })
  
  page.drawText('UNIT PRICE', {
    x: width - 180,
    y: yPosition - 15,
    size: 10,
    font: fontBold,
    color: darkColor,
  })
  
  page.drawText('AMOUNT', {
    x: width - 100,
    y: yPosition - 15,
    size: 10,
    font: fontBold,
    color: darkColor,
  })
  
  yPosition -= 40
  
  // Invoice Items with pagination support
  const itemsPerPage = 15 // Maximum items before new page
  let itemCount = 0
  const minSpaceForTotals = 200 // Reserve space for totals section
  
  for (const item of invoice.items) {
    // Check if we need a new page (less than minimum space for totals)
    if (yPosition < minSpaceForTotals) {
      page = pdfDoc.addPage([595, 842])
      yPosition = height - 60
      
      // Redraw table header on new page
      page.drawRectangle({
        x: 50,
        y: yPosition - 20,
        width: width - 100,
        height: 25,
        color: rgb(0.95, 0.97, 1),
      })
      
      page.drawText('DESCRIPTION', {
        x: 60,
        y: yPosition - 15,
        size: 10,
        font: fontBold,
        color: darkColor,
      })
      
      page.drawText('QTY', {
        x: width - 240,
        y: yPosition - 15,
        size: 10,
        font: fontBold,
        color: darkColor,
      })
      
      page.drawText('UNIT PRICE', {
        x: width - 180,
        y: yPosition - 15,
        size: 10,
        font: fontBold,
        color: darkColor,
      })
      
      page.drawText('AMOUNT', {
        x: width - 100,
        y: yPosition - 15,
        size: 10,
        font: fontBold,
        color: darkColor,
      })
      
      yPosition -= 40
    }
    
    page.drawText(item.description, {
      x: 60,
      y: yPosition,
      size: 10,
      font: font,
      color: blackColor,
      maxWidth: 250,
    })
    
    page.drawText(item.quantity.toString(), {
      x: width - 235,
      y: yPosition,
      size: 10,
      font: font,
      color: blackColor,
    })
    
    page.drawText(`Rs.${item.unitPrice.toFixed(2)}`, {
      x: width - 180,
      y: yPosition,
      size: 10,
      font: font,
      color: blackColor,
    })
    
    page.drawText(`Rs.${item.amount.toFixed(2)}`, {
      x: width - 100,
      y: yPosition,
      size: 10,
      font: font,
      color: blackColor,
    })
    
    yPosition -= 25
    itemCount++
  }
  
  // Add spacing between last item and totals section (minimum 40px)
  yPosition -= 40
  
  // Check if we need a new page for totals (if less than 180px space)
  if (yPosition < 180) {
    page = pdfDoc.addPage([595, 842])
    yPosition = height - 100 // Start totals from top of new page
  }
  
  // Totals Section
  page.drawLine({
    start: { x: width - 280, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 1,
    color: grayColor,
  })
  
  yPosition -= 25
  
  // Subtotal
  page.drawText('Subtotal:', {
    x: width - 260,
    y: yPosition,
    size: 11,
    font: font,
    color: blackColor,
  })
  
  page.drawText(`Rs.${invoice.subtotal.toFixed(2)}`, {
    x: width - 140,
    y: yPosition,
    size: 11,
    font: font,
    color: blackColor,
  })
  
  yPosition -= 20
  
  // Tax
  page.drawText('Tax:', {
    x: width - 260,
    y: yPosition,
    size: 11,
    font: font,
    color: blackColor,
  })
  
  page.drawText(`Rs.${invoice.tax.toFixed(2)}`, {
    x: width - 140,
    y: yPosition,
    size: 11,
    font: font,
    color: blackColor,
  })
  
  yPosition -= 25
  
  // Total - Wider box to accommodate all digits
  page.drawRectangle({
    x: width - 280,
    y: yPosition - 20,
    width: 230,
    height: 35,
    color: primaryColor,
  })
  
  page.drawText('TOTAL:', {
    x: width - 260,
    y: yPosition - 8,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  
  page.drawText(`Rs.${invoice.total.toFixed(2)}`, {
    x: width - 140,
    y: yPosition - 8,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  
  yPosition -= 60
  
  // Notes - Fixed positioning with proper spacing
  if (invoice.notes) {
    // Add extra spacing before notes
    yPosition -= 20
    
    // Check if we need space for notes (at least 80px)
    if (yPosition < 100) {
      page = pdfDoc.addPage([595, 842])
      yPosition = height - 100
    }
    
    page.drawText('NOTES:', {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: primaryColor,
    })
    
    yPosition -= 18
    
    // Handle multi-line notes
    const noteLines = invoice.notes.split('\n')
    for (const line of noteLines) {
      if (yPosition < 80) { // Check if we need new page for notes continuation
        page = pdfDoc.addPage([595, 842])
        yPosition = height - 60
      }
      
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
        color: grayColor,
        maxWidth: width - 100,
      })
      
      yPosition -= 15
    }
  }
  
  // Footer
  page.drawText('Thank you for your business!', {
    x: 50,
    y: 50,
    size: 10,
    font: fontBold,
    color: accentColor,
  })
  
  page.drawText('Powered by Oryxa InvoiceFlow', {
    x: 50,
    y: 35,
    size: 8,
    font: font,
    color: grayColor,
  })
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}
