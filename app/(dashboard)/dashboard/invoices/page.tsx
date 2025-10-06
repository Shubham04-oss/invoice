import Link from 'next/link';
import Button from '@/components/ui/Button';
import InvoiceListTable from '@/components/invoices/InvoiceListTable';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-xl p-6 border border-white/10 backdrop-blur-xl bg-white/5">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Invoices</h1>
          <Link href="/dashboard/invoices/new">
            <Button variant="primary">+ Create Invoice</Button>
          </Link>
        </div>
      </div>
      <InvoiceListTable />
    </div>
  );
}
