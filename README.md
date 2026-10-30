# 🏛️ College Hall Booking System (CampusHalls)

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.13-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

A modern, responsive web application designed for colleges and universities to manage auditorium, seminar hall, conference room, and classroom reservations efficiently. It eliminates double-bookings, streamlines administrative approvals, manages maintenance schedules, and keeps students and faculty informed in real time.

---

## 📑 Table of Contents

- [Features](#-features)
  - [For Students and Faculty](#for-students-and-faculty)
  - [For Administrators](#for-administrators)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Setup Database Schema](#4-setup-database-schema)
  - [5. Run Development Server](#5-run-development-server)
- [Creating the First Admin](#-creating-the-first-admin)
- [Project Structure](#-project-structure)
- [Application Routes](#-application-routes)
- [Available Scripts](#-available-scripts)
- [Security & Architecture](#-security--architecture)

---

## ✨ Features

### For Students and Faculty
- **Explore Venues:** Browse seminar halls, auditoriums, and labs with capacity filters, equipment details, photos, and location maps.
- **Real-Time Availability:** Check schedule calendars and avoid booking conflicts.
- **Booking Requests:** Submit booking requests with event purpose, expected attendees, and required facilities.
- **Live Status Tracking:** Track booking lifecycle (`Pending`, `Approved`, `Rejected`, `Cancelled`) with realtime status updates.
- **Notifications & Events:** Receive notifications for request reviews and browse campus events.
- **User Profile & Themes:** Manage personal details and switch between Dark and Light mode.

### For Administrators
- **Executive Dashboard:** Quick stats on pending requests, total bookings, active venues, and today's schedule.
- **Booking Management:** Review, approve, or reject booking requests with custom admin remarks.
- **Venue & Facility Management:** Add new halls, edit venue specifications, upload venue images, and toggle operational status.
- **Campus Event Publishing:** Create and publish official campus events linked to venues.
- **Maintenance Tracking:** Schedule hall maintenance periods and mark them in-progress or completed.
- **User & Role Management:** Manage user accounts and promote faculty to administrators.
- **Audit Logs & Reports:** Review history of booking decisions and venue usage reports.

---

## 🛠️ Tech Stack

- **Frontend:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Routing:** [React Router v6](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with PostCSS & Autoprefixer
- **Icons & Animations:** [Lucide React](https://lucide.dev/) & [Framer Motion](https://www.framer.com/motion/)
- **Backend & Database:** [Supabase](https://supabase.com/)
  - PostgreSQL with Row Level Security (RLS)
  - Supabase Auth (Email & Password authentication)
  - Supabase Storage (Public bucket for hall images)
  - Realtime publication subscriptions

---

## 📋 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A free [Supabase](https://supabase.com/) account and project

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/prajnashetty1/College_HallBooking.git
cd College_HallBooking
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> [!IMPORTANT]
> Use only the public `anon` key in `VITE_SUPABASE_ANON_KEY`. Never expose your Supabase `service_role` key in frontend code or environment variables.

### 4. Setup Database Schema

1. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor** → **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste them into the query editor.
4. Click **Run**.

This script automatically provisions:
- Core tables (`profiles`, `halls`, `bookings`, `events`, `notifications`, `maintenance`, `audit_logs`)
- Automatic profile creation trigger on signup
- Overlap prevention constraints
- Row Level Security (RLS) policies
- Storage bucket `hall-images`
- Initial seed data (8 sample halls and sample campus events)

*(Optional)* To disable email verification during development:
- Go to **Authentication** → **Providers** → **Email** in Supabase and toggle off **Confirm email**.

### 5. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Creating the First Admin

1. Sign up for a new account through the application UI (`/register`).
2. Go to the Supabase **SQL Editor** and run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

3. Sign out and sign back in on the web app to access the `/admin` portal.

---

## 📁 Project Structure

```text
college-hall-management/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components (Navbar, Footer, Modals, Cards)
│   ├── context/            # AuthContext, ThemeContext
│   ├── lib/                # Supabase client instance and helper utilities
│   ├── pages/              # Application views:
│   │   ├── admin/          # Admin portal (Dashboard, Halls, Bookings, Events, Users, etc.)
│   │   ├── auth/           # Login, Register, Forgot Password
│   │   └── ...             # Halls, Hall Details, Events, Profile, Bookings
│   ├── types/              # TypeScript interface definitions (database types, models)
│   ├── App.tsx             # Route definitions & layout wrappers
│   ├── main.tsx            # React application root
│   └── index.css           # Tailwind CSS directives and global styles
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema, functions, triggers, and seed data
├── .env                    # Local environment variables (git-ignored)
├── package.json            # Project dependencies and npm scripts
├── tailwind.config.js      # Tailwind theme configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

---

## 🧭 Application Routes

| Path | Description | Access |
| --- | --- | --- |
| `/` | Landing page | Public |
| `/halls` | Hall listings with filters | Public |
| `/halls/:id` | Venue specifications & booking request form | Authenticated |
| `/events` | Campus events schedule | Public |
| `/bookings` | My Booking Requests & Status | Authenticated |
| `/profile` | Profile management & settings | Authenticated |
| `/login` | Account Sign In | Public |
| `/register` | Student / Faculty Sign Up | Public |
| `/admin` | Administrative Dashboard | Admin only |
| `/admin/bookings`| Review & approve booking requests | Admin only |
| `/admin/halls` | Manage venue listings & availability | Admin only |
| `/admin/events` | Create & publish campus events | Admin only |
| `/admin/maintenance` | Schedule venue maintenance | Admin only |
| `/admin/users` | Manage user roles & permissions | Admin only |
| `/admin/reports` | View venue analytics and usage reports | Admin only |

---

## 📜 Available Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Runs the Vite dev server with hot reload |
| `npm run build` | Compiles TypeScript and creates optimized production bundle in `dist/` |
| `npm run preview` | Starts a local server to preview the production build |

---

## 🔒 Security & Architecture

- **Row Level Security (RLS):** Every table is guarded with fine-grained PostgreSQL RLS policies ensuring users can only read permitted resources and edit their own submissions.
- **Double-Booking Prevention:** Overlapping venue reservations for overlapping time slots are validated and blocked at both the database and application levels.
- **Role-Based Access Control (RBAC):** Admin routes are guarded on both client-side route guards and database triggers.

---

## 👤 Author

- **GitHub:** [@prajnashetty1](https://github.com/prajnashetty1)
- **Repository:** [College_HallBooking](https://github.com/prajnashetty1/College_HallBooking)
