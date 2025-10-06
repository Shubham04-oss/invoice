export async function generatePdfForInvoice(invoice: any) {
  // placeholder: return a Buffer or stream in real app
  return Buffer.from('PDF:' + JSON.stringify(invoice))
}
