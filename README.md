paylaw-app/
│
├── app/                        ← All your pages live here
│   ├── layout.tsx              ← Root layout (wraps every page)
│   ├── page.tsx                ← Home page (redirects to dashboard)
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx        ← Login page
│   ├── dashboard/
│   │   └── page.tsx            ← Dashboard page
│   ├── paylaws/
│   │   ├── page.tsx            ← Paylaws list page
│   │   └── new/
│   │       └── page.tsx        ← Create paylaw form
│   ├── overtime/
│   │   ├── page.tsx            ← Overtime list page
│   │   └── new/
│   │       └── page.tsx        ← Create overtime form
│   ├── employees/
│   │   └── page.tsx            ← Employees page
│   ├── summary/
│   │   └── page.tsx            ← Summary page
│   └── api/                    ← Backend API routes
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts    ← NextAuth handler
│       ├── paylaws/
│       │   └── route.ts        ← Create/get paylaws
│       ├── overtime/
│       │   └── route.ts        ← Create/get overtime
│       └── employees/
│           └── route.ts        ← Create/get employees
│
├── components/                 ← Reusable UI pieces
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── ui/
│       └── Button.tsx
│
├── lib/                        ← Helper files
│   ├── prisma.ts               ← Prisma Client instance
│   └── auth.ts                 ← NextAuth config
│
├── prisma/                     ← Database schema
│   └── schema.prisma           ← Your tables go here
│
├── public/
│   ├── manifest.json           ← PWA config (app name, icons)
│   ├── icons/                  ← App icons for phones
│   └── sw.js                   ← Service worker (auto-generated)
│
├── .env                        ← Secret keys (never share this)
├── next.config.ts              ← Next.js config (PWA setup goes here)
└── middleware.ts               ← Protects pages (redirect if not logged in)