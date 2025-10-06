import { PrismaClient } from '@prisma/client'
import { hashPassword } from './lib/auth/password'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding test users...')

  // Create or get test tenant
  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Test Company' }
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Test Company' }
    })
    console.log('✓ Created tenant: Test Company')
  } else {
    console.log('✓ Using existing tenant: Test Company')
  }

  // User 1: admin@test.com
  const password1 = await hashPassword('admin123')
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: password1,
      firstName: 'Admin',
      lastName: 'User',
      tenantId: tenant.id,
    },
  })
  console.log('✓ Created user 1: admin@test.com / admin123')

  // User 2: demo@test.com
  const password2 = await hashPassword('demo123')
  const user2 = await prisma.user.upsert({
    where: { email: 'demo@test.com' },
    update: {},
    create: {
      email: 'demo@test.com',
      passwordHash: password2,
      firstName: 'Demo',
      lastName: 'User',
      tenantId: tenant.id,
    },
  })
  console.log('✓ Created user 2: demo@test.com / demo123')

  console.log('\n✅ Test users added successfully!')
  console.log('\nLogin credentials:')
  console.log('1. Email: admin@test.com | Password: admin123')
  console.log('2. Email: demo@test.com  | Password: demo123')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
