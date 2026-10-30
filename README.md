# CampusHalls — College Hall Management System

CampusHalls is a web application for browsing college venues, requesting hall bookings, and managing campus events and facilities. Students and faculty can submit and track bookings; administrators can review requests and manage halls, events, users, and maintenance.

## Features

### Students and faculty

- Browse halls, capacities, locations, facilities, and availability.
- Check hall booking and maintenance schedules.
- Request a hall for an event and track the booking status.
- Cancel pending bookings.
- View campus events and receive booking notifications.
- Manage profile details and switch between light and dark themes.

### Administrators

- View dashboard statistics and recent activity.
- Approve or reject booking requests with notes.
- Manage hall details, images, facilities, and operational status.
- Create and update campus events.
- Schedule maintenance and mark it in progress or complete.
- Search users and manage their roles.
- Review reports and audit activity.

The database checks for overlapping pending or approved bookings to prevent double-booking. Booking decisions and their notifications are handled together in the database.

## Technology

- React 18 and TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Realtime, and Storage)
- Framer Motion and Lucide React

## Requirements

- Node.js (an active LTS release is recommended) and npm
- A Supabase project

## Getting started

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure Supabase

Create a Supabase project, then open **Project Settings → API** and copy the project URL and anon/public key.

Create a `.env` file in the project root (next to `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Replace the example values with your project's values. Do not put a Supabase `service_role` key in this file or in frontend code. Vite variables are included in the browser bundle; the anon key is intended for client applications and relies on database Row Level Security (RLS) for access control.

### 3. Create the database schema

In the Supabase dashboard, open **SQL Editor**, create a new query, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it against a new/empty project.

The schema sets up:

- Tables for profiles, halls, bookings, events, notifications, maintenance, and audit logs.
- Role and status enums, indexes, and row-level security policies.
- An auth trigger that creates a profile when a user registers.
- Booking-overlap protection and an admin-only booking review function.
- Realtime publication for bookings, events, notifications, and maintenance.
- A public `hall-images` Storage bucket and eight sample halls plus sample events.

The schema file is designed for initial project setup. It contains policy and enum creation statements that are not all safe to re-run against a database that already has the schema.

### 4. Configure email confirmation (optional)

The app uses email and password for sign-in. To let people sign in immediately after registering without confirming their email, open **Authentication → Providers → Email** in Supabase and turn off **Confirm email**. This is a Supabase project setting; changing the app code alone cannot disable server-side email confirmation.

### 5. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Create the first administrator

1. Register a normal account through the app.
2. In Supabase **SQL Editor**, run the following query with the same email address:

   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'you@college.edu';
   ```

3. Sign out and sign back in if the account was already active, then open `/admin`.

Only promote trusted accounts. Administrators have access to user, booking, hall, event, maintenance, and report management.

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite development server. |
| `npm run build` | Run the TypeScript check and create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally for a preview. |

## Routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Home page | Public |
| `/halls` | Browse halls | App page |
| `/halls/:id` | Hall details and booking | App page |
| `/events` | Campus events | App page |
| `/login` | Sign in | Public |
| `/register` | Create a student or faculty account | Public |
| `/forgot-password` | Request a password reset | Public |
| `/profile` | View and edit profile | Signed-in users |
| `/bookings` | View and manage personal bookings | Signed-in users |
| `/admin` | Admin dashboard | Administrators |
| `/admin/bookings` | Review booking requests | Administrators |
| `/admin/halls` | Manage halls | Administrators |
| `/admin/users` | Manage user roles | Administrators |
| `/admin/events` | Manage events | Administrators |
| `/admin/maintenance` | Manage maintenance | Administrators |
| `/admin/reports` | View reports | Administrators |

## Project structure

```text
src/
  components/       Shared UI components
  context/          Authentication and theme state
  lib/              Supabase client and utility functions
  pages/            Public, user, and admin pages
  types/            Shared TypeScript data types
  App.tsx           Application routes and providers
  main.tsx          Application entry point
supabase/
  schema.sql        Database schema, policies, functions, and seed data
```

## Deployment

1. Build the project with `npm run build`.
2. Deploy the generated `dist/` directory to a static hosting provider.
3. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's build environment, then rebuild.
4. Configure the host to serve `index.html` for application routes (SPA fallback), so paths such as `/halls` and `/admin` work when opened directly.
5. Add the production site URL to the Supabase Auth redirect/site URL settings, especially if using password reset.

## Troubleshooting

- **Missing Supabase environment variables:** Confirm the root `.env` file contains both variables, then restart the Vite server.
- **Registration asks the user to check email:** Email confirmation is still enabled in Supabase. Follow the optional email-confirmation step above, or complete the confirmation link.
- **No halls appear:** Confirm `supabase/schema.sql` completed successfully and that the session is authenticated. The initial schema inserts eight sample halls.
- **A user cannot access `/admin`:** Confirm their `public.profiles.role` is `admin`, then sign out and sign in again.
- **Direct route returns a 404 after deployment:** Enable SPA fallback/rewrites to `index.html` in the hosting provider.

## Security notes

- Keep Supabase RLS enabled. The supplied schema enables RLS and defines policies for the application's tables.
- Never expose the Supabase service-role key in a Vite environment variable or any client-side code.
- Use HTTPS in production and restrict administrator access to trusted users.
- Review and adapt the supplied policies and authentication settings to your institution's requirements before using real user data.
