import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import RegisterForm from '@/components/forms/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      <Card className="w-full max-w-md" padding="lg">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Image 
              src="/oryxa-o-logo.png" 
              alt="Oryxa Logo" 
              width={64} 
              height={64}
              className="animate-pulse"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Join Oryxa InvoiceFlow to manage your invoices
          </p>
        </div>

        <RegisterForm />

        <div className="mt-6 text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
