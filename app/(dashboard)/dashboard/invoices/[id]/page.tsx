export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  return (
    <article>
      <h2 className="text-xl font-semibold">Invoice {id}</h2>
      <p>Invoice details for {id}.</p>
    </article>
  )
}
