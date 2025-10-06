export default function InvoiceForm() {
  return (
    <form>
      <label>Client<input name="client" /></label>
      <label>Amount<input type="number" name="amount" /></label>
      <button type="submit">Save</button>
    </form>
  )
}
