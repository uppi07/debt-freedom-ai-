# Debt Freedom AI

Debt Freedom AI is a modern debt payoff planner built as a Next.js 16 (+ App Router, TypeScript) web application. This project empowers users to systematically record their financial details, model various payoff strategies, and execute their journey towards debt freedom—all with a sleek, responsive, and secure experience.

## 🚀 Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **React 19** (client components per page)
- **Tailwind CSS v4** for styling
- **MongoDB via Mongoose** for persistent data storage
- **JWT Auth (ES256, httpOnly cookies)** and **argon2** password hashing
- **Chart.js/react-chartjs-2 & Recharts** interactive data visualizations
- **Modern Dev Tools**: Zod validation (planned), server-side guards

## 🏦 Core Features

### Secure & Modern Authentication
- **Sign-up/Sign-in** (`app/(auth)/signup`, `app/(auth)/signin`)
- Password hashing with **argon2**
- **JWTs (ES256), httpOnly cookies, middleware-authenticated API routes**

### Financial Data Management
- **Income/Expense Tracking** (`app/api/income/*`, `app/api/expenses/*`)
- **Debt Dashboard** (`app/my-debts/page.tsx`)
  - Supports recurring and one-time debts
  - Edit/delete functionality, emits plan refresh events

### Advanced Debt Payoff Planning & Simulation
- **Avalanche & Snowball modeling**
  - Month-by-month payment calculations and summaries (`lib/simulations.ts`)
  - Real-time **dashboard metrics** and cleared-debt list (`app/dashboard/page.tsx`)
- **Monthly Execution**
  - Mark payments, accrue interest, update MongoDB docs
  - Cleared/deleted debts tracked in `DeletedClearedDebt` and `app/api/cleared/delete/route.ts`

### Engaging Visuals
- **Interactive Charts**: Payment timeline, payoff graphs (`components/DebtTimelineChart.tsx`, `components/PayoffGraph.tsx`)
- **Planner hook**: Cross-tab broadcast refreshes (`lib/hooks/usePlan.ts`)

## 📈 User Flow

1. **Capture income/expenses** (`app/income-expenses/page.tsx`)
2. **Manage debts** (recurring, one-time, edit/delete and refresh plan)
3. **Track metrics and debt clearance** via dashboard
4. **Execute monthly payments**; timeline updates automatically
5. **Explore (upcoming)**: Settings, currency options, AI insights (planned), profile pages

## 🧠 Why Employers Should Care

- **Cutting-Edge Stack**: Live with Next.js 16, React 19, and TypeScript for robustness and future-friendly development.
- **Security First**: Modern password hashing (argon2), JWT authentication strategies, server-side session protection.
- **Business Impact**: Models real-world debt reduction strategies with persistence, analytics, and seamless user UX.
- **Engineering Depth**: Complex simulation logic, smart hooks, and multi-tab refresh architecture.
- **Growth Potential**: Clean modular codebase, planned roadmap for validation, multi-tenant support, and API hardening.
- **Visual Polish**: Data-driven insights via Chart.js, Recharts, and responsive Tailwind UI.

## 🛠️ Next Milestones

- Add validation/error handling to forms and APIs with **zod** & friendly user feedback
- Protect API routes — verify JWT, per-user data isolation, multi-tenant support
- Persist plan payment/version history for richer analytics
- Settings enhancements: currency, FX rates, recurring salary/rent tracking
- Test coverage for simulation logic (edge cases, API contracts)
- UX polish: improved landing page, AI insights, solid loading/empty states
- Complete or remove stubs: `components/Input.tsx`, `components/DebtCard.tsx`, `lib/planCalculator.ts`, etc.

## 🧩 Folder Highlights

```
app/
  ├── (auth)/signin|signup      # Auth flows
  ├── income-expenses/          # Income/expenses input
  ├── my-debts/                 # Debt records
  ├── dashboard/                # Metrics/cleared debts
  ├── monthly-plan/             # Payment execution
  ├── profile/, settings/       # Placeholders for future expansion
  └── api/                      # REST API endpoints
  
models/                         # MongoDB Mongoose models
lib/
  ├── simulations.ts            # Payoff strategy engine
  ├── hooks/usePlan.ts          # Planner refresh hook
  ├── auth.ts                   # JWT, argon2 utilities
components/
  ├── DebtTimelineChart.tsx     # Chart.js chart
  ├── PayoffGraph.tsx           # Recharts graph
  ├── Navbar.tsx, Input.tsx     # UI stubs
```

## 💡 Interested?
Seeking opportunities to contribute to fintech, personal finance, backend/frontend engineering, or AI-powered analytics. [Let’s talk!](mailto:your.email@example.com) — I'm open to new challenges!

---

**Debt Freedom AI** — Unleash modern engineering to empower financial freedom.
