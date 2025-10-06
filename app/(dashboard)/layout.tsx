export default function DashboardLayout({ children }: { children: any }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  )
}
