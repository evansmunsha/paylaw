# PayLaw — Construction Payroll App

A full-stack payroll management app built for construction site managers in Zambia.
Track workers, mark monthly attendance, record overtime, generate PDF reports, and view pay summaries — all from one place.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth.js (email + password) |
| Styling | Tailwind CSS |
| PDF | jsPDF + jsPDF AutoTable |
| PWA | Manual service worker |
| Hosting | Vercel (recommended) |

---

## Features

- **Login** — secure email and password authentication
- **Employees** — add workers with their own day rate and OT hourly rate
- **Paylaws** — monthly attendance grid, mark present/absent per day, auto-calculates salary
- **Overtime** — monthly hours grid, enter hours per day, auto-calculates OT pay
- **Continue marking** — save as draft and come back any day to keep marking
- **PDF download** — full printable paylaw and overtime sheets with signatures
- **Summary** — per-worker and per-site pay breakdown with bar chart
- **PWA** — installable on phones, tablets, and computers
- **Offline** — app shell works offline, shows offline page when no internet

---

## Getting Started

### 1. Clone the repo

\`\`\`bash
git clone https://github.com/yourusername/paylaw-app.git
cd paylaw-app
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set up environment variables

Create a `.env` file in the root:

\`\`\`env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

### 4. Set up the database

\`\`\`bash
npx prisma migrate dev --name init
npx prisma generate
\`\`\`

### 5. Create your first account

\`\`\`bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword","name":"Your Name"}'
\`\`\`

### 6. Run the app

\`\`\`bash
npm run dev
\`\`\`

---

## Project Structure

\`\`\`
paylaw-app/
├── app/
│   ├── (main)/          # Protected pages with sidebar
│   │   ├── dashboard/
│   │   ├── paylaws/
│   │   ├── overtime/
│   │   ├── employees/
│   │   └── summary/
│   ├── api/             # Backend API routes
│   │   ├── auth/
│   │   ├── register/
│   │   ├── paylaws/
│   │   ├── overtime/
│   │   └── employees/
│   └── login/
├── components/          # Reusable UI components
├── lib/                 # Prisma client, auth config, PDF generators
├── prisma/              # Database schema
└── public/              # Icons, manifest, service worker
\`\`\`

---

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to vercel.com and import the repo
3. Add your environment variables in Vercel project settings
4. Change `NEXTAUTH_URL` to your Vercel domain
5. Deploy

---

## License

MIT — free to use and modify.# paylaw
