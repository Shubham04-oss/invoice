# InvoiceFlow - Invoice SaaS MVP

A modern, dark-themed invoice management SaaS built with Next.js (App Router), Prisma, TypeScript, and Tailwind CSS. Features a stunning glassmorphism UI inspired by contemporary B2B platforms.

## 🎨 Design Features

- **Dark Navy Theme**: Professional dark color scheme with navy backgrounds
- **Glassmorphism UI**: Frosted glass effects with backdrop blur
- **Cyan Accents**: Eye-catching cyan/teal highlights and CTAs
- **Responsive Design**: Mobile-first, fully responsive across all devices
- **Modern Animations**: Smooth transitions, fades, and hover effects
- **Component Library**: Reusable UI components following atomic design

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom dark theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth with bcrypt
- **UI Pattern**: Glassmorphism, dark mode, component-driven

## 📁 Project Structure

```
invoice/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles & Tailwind
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── (dashboard)/             # Dashboard group
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   └── dashboard/           # Dashboard pages
│   │       ├── page.tsx         # Dashboard home
│   │       └── invoices/        # Invoice pages
│   ├── auth/                    # Auth pages
│   │   └── login/
│   ├── register/
│   └── api/                     # API routes
│       ├── auth/
│       └── invoices/
├── components/                   # React components
│   ├── ui/                      # Atomic UI components
│   │   ├── Button.tsx           # Multi-variant button
│   │   ├── Card.tsx             # Glass card component
│   │   └── Input.tsx            # Form input with labels
│   └── layout/                  # Layout components
│       ├── Navbar.tsx           # Top navigation
│       └── Sidebar.tsx          # Dashboard sidebar
├── lib/                         # Utilities & helpers
│   ├── auth/                    # Authentication utilities
│   ├── db/                      # Database client
│   └── validations/             # Validation schemas
├── prisma/                      # Database
│   └── schema.prisma            # Prisma schema
├── types/                       # TypeScript types
├── tailwind.config.ts           # Tailwind configuration
└── tsconfig.json                # TypeScript config
```

## 🎯 Features

### ✅ Completed Features
- Landing page with hero section and feature cards
- User authentication (login/register)
- Multi-tenant architecture
- Dashboard with statistics
- Invoice list with filters and status badges
- Invoice creation with line items
- Invoice detail view
- Glassmorphism UI components
- Dark theme with cyan accents
- Responsive navigation and sidebar

### 🔜 Upcoming Features
- PDF invoice generation
- Email invoice sending
- Payment tracking
- Analytics dashboard
- Team collaboration
- API documentation

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd /home/shubham/Projects/invoice
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install missing dependencies** (if needed)
   ```bash
   npm install tailwindcss postcss autoprefixer
   npm install @types/react @types/react-dom @types/node
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/invoicedb"
   JWT_SECRET="your-secret-key-here"
   ```

5. **Initialize the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Theme Customization

The design system is built with Tailwind CSS and can be customized in `tailwind.config.ts`:

### Color Palette
- **Navy**: Dark backgrounds (`navy-900`, `navy-950`)
- **Cyan**: Primary accents (`cyan-400`, `cyan-500`)
- **Glass**: Glassmorphism effects (`glass`, `glass-card`)

### Custom Classes
- `.glass` - Basic glassmorphism effect
- `.glass-card` - Glass card with shadow
- `.glass-hover` - Hover state for glass elements
- `.btn-primary` - Primary cyan button
- `.btn-secondary` - Secondary glass button
- `.badge-*` - Status badges (success, warning, danger, info)

## 📱 Pages Overview

### Public Pages
- **/** - Landing page with hero and features
- **/auth/login** - User login
- **/register** - User registration

### Protected Pages (Dashboard)
- **/dashboard** - Dashboard with statistics
- **/dashboard/invoices** - Invoice list
- **/dashboard/invoices/new** - Create new invoice
- **/dashboard/invoices/[id]** - Invoice detail view

## 🔧 Component Usage

### Button Component
```tsx
import Button from '@/components/ui/Button'

<Button variant="primary" size="lg">
  Click Me
</Button>
```

### Card Component
```tsx
import Card from '@/components/ui/Card'

<Card hover padding="lg">
  <h2>Card Title</h2>
  <p>Card content</p>
</Card>
```

### Input Component
```tsx
import Input from '@/components/ui/Input'

<Input 
  label="Email" 
  type="email" 
  placeholder="you@example.com"
  required 
/>
```

## 🗄️ Database Schema

The application uses a multi-tenant architecture:

- **Tenant**: Organizations/companies
- **User**: Users belonging to tenants
- **Invoice**: Invoices created by users
- **InvoiceItem**: Line items for each invoice

## 🚦 Development Workflow

1. Make your changes
2. Test in development mode
3. Build for production: `npm run build`
4. Start production server: `npm start`

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `NEXT_PUBLIC_APP_URL` | App URL for callbacks |

## 🎯 Design Principles

1. **Component-Driven**: Reusable, atomic components
2. **Mobile-First**: Responsive from the ground up
3. **Accessibility**: Semantic HTML and ARIA labels
4. **Performance**: Optimized bundles and lazy loading
5. **Dark Theme**: Professional, modern aesthetic
6. **Glassmorphism**: Frosted glass effects throughout

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspired by modern B2B SaaS platforms
- Built with Next.js, Tailwind CSS, and Prisma
- Glassmorphism UI pattern for modern aesthetics

---

**Built with ❤️ using Next.js and Tailwind CSS**

## 🚢 Deploying to Railway (production)

This repository includes a Dockerfile and an entrypoint script that make deploying to Railway straightforward. The image will run Prisma client generation and then start the Next.js server. If `DATABASE_URL` is present, the entrypoint will attempt to run migrations with `prisma migrate deploy`.

Recommended steps:

1. Create a new project on Railway and connect your GitHub repo or deploy via Docker image.
2. Set the following environment variables in the Railway project -> Variables (use Railway UI or CLI):
   - `DATABASE_URL` (Postgres connection string)
   - `JWT_SECRET` (a long, random string)
   - `NEXT_PUBLIC_APP_URL` (e.g., https://your-railway-domain)
   - `NODE_ENV=production`
   - Optional: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`, `STRIPE_*`, etc.
3. If you deploy using Railway's Dockerfile build, it will run `npm start` which runs the Next.js production server.
4. If you prefer, you can build with Railway and run `npx prisma migrate deploy` manually from a one-off task before starting the web service.

Notes and caveats:
- Railway provides ephemeral storage. If you rely on a local SQLite `dev.db`, it will not be durable — use PostgreSQL (the schema is set up for Postgres by default).
- If you use an external object store (Backblaze S3-compatible), set the `B2_*` env vars in Railway.
- Ensure `JWT_SECRET` is kept secret and rotated when needed.

Troubleshooting:
- If you see Prisma errors related to missing migrations, run `npx prisma migrate deploy` against your database before starting.
- If you're building native modules (not necessary here since we switched to `bcryptjs`), ensure Railway's base image matches your build environment.

Happy deploying!

# invoice-prod
