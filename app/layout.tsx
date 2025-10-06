import './globals.css'
import type { Metadata } from 'next'

// Force dynamic rendering to avoid static prerender attempting to run
// server-only code (headers, middleware) during the build.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Oryxa InvoiceFlow - Billing & Automation, refined',
  description: 'Monitor pipeline health, track revenue, and activate automations—all from a single glass dashboard. Professional invoicing platform by Oryxa.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('wheel', function(e) {
                if (document.activeElement.type === 'number') {
                  document.activeElement.blur();
                }
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
