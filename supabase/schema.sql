-- ============================================================================
-- CampusHalls — College Hall Management System
-- Complete Supabase schema: tables, enums, RLS, functions, triggers,
-- realtime publication, storage, and idempotent seed data (8 halls).
-- Run this entire file once in the Supabase SQL Editor.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('student', 'faculty', 'admin');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.event_status as enum ('upcoming', 'ongoing', 'completed', 'cancelled');
create type public.maintenance_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  role        public.user_role not null default 'student',
  department  text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.halls (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  description text,
  capacity    integer not null check (capacity > 0),
  location    text not null,
  image_url   text,
  facilities  text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.bookings (
  id           uuid primary key default uuid_generate_v4(),
  hall_id      uuid not null references public.halls(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  title        text not null check (char_length(title) between 3 and 120),
  description  text check (description is null or char_length(description) <= 500),
  event_date   date not null,
  start_time   time not null,
  end_time     time not null,
  status       public.booking_status not null default 'pending',
  admin_notes  text,
  created_at   timestamptz not null default now(),
  constraint valid_time_range check (end_time > start_time)
);
create index if not exists bookings_hall_date_idx on public.bookings (hall_id, event_date);
create index if not exists bookings_user_idx on public.bookings (user_id);

create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  hall_id     uuid references public.halls(id) on delete set null,
  event_date  date not null,
  start_time  time,
  end_time    time,
  status      public.event_status not null default 'upcoming',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists events_date_idx on public.events (event_date);

create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  message    text,
  type       text default 'system',
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, is_read);

create table if not exists public.maintenance (
  id             uuid primary key default uuid_generate_v4(),
  hall_id        uuid not null references public.halls(id) on delete cascade,
  title          text not null,
  description    text,
  scheduled_date date not null,
  start_time     time,
  end_time       time,
  status         public.maintenance_status not null default 'scheduled',
  created_at     timestamptz not null default now()
);
create index if not exists maintenance_hall_date_idx on public.maintenance (hall_id, scheduled_date);

create table if not exists public.audit_logs (
  id         uuid primary key default uuid_generate_v4(),
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  table_name text,
  record_id  uuid,
  details    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select public.my_role() = 'admin' $$;

-- ---------------------------------------------------------------------------
-- Auth trigger: create profile on signup (role restricted to student/faculty)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    coalesce(
      case
        when new.raw_user_meta_data ->> 'role' in ('student', 'faculty')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      end,
      'student'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Double-booking protection (database level)
-- Rejects any insert/update that overlaps an existing pending/approved booking
-- for the same hall and date. Runs BEFORE the write, so races are impossible.
-- ---------------------------------------------------------------------------
create or replace function public.check_booking_conflict()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.hall_id = new.hall_id
      and b.event_date = new.event_date
      and b.status in ('pending', 'approved')
      and b.id is distinct from new.id
      and tsrange(b.event_date + b.start_time, b.event_date + b.end_time, '[)')
          && tsrange(new.event_date + new.start_time, new.event_date + new.end_time, '[)')
  ) then
    raise exception 'Booking conflict: the hall is already booked for an overlapping time slot.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_conflict_check on public.bookings;
create trigger bookings_conflict_check
  before insert or update on public.bookings
  for each row execute function public.check_booking_conflict();

-- ---------------------------------------------------------------------------
-- Booking review (approve/reject) — admin only, atomic, notifies the user,
-- writes an audit log. If approval would double-book, the conflict trigger
-- aborts the whole transaction.
-- ---------------------------------------------------------------------------
create or replace function public.review_booking(
  p_booking_id uuid,
  p_approve boolean,
  p_notes text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review bookings.';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found.';
  end if;
  if v_booking.status <> 'pending' then
    raise exception 'This booking has already been reviewed.';
  end if;

  update public.bookings
  set status = case when p_approve then 'approved'::public.booking_status
                    else 'rejected'::public.booking_status end,
      admin_notes = p_notes
  where id = p_booking_id;

  insert into public.notifications (user_id, title, message, type, link)
  values (
    v_booking.user_id,
    case when p_approve then 'Booking approved' else 'Booking rejected' end,
    case when p_approve
      then 'Your booking "' || v_booking.title || '" has been approved.'
      else 'Your booking "' || v_booking.title || '" was rejected.'
           || case when p_notes is not null then ' Reason: ' || p_notes else '' end
    end,
    'booking',
    '/bookings'
  );

  insert into public.audit_logs (actor_id, action, table_name, record_id, details)
  values (
    auth.uid(),
    case when p_approve then 'booking.approved' else 'booking.rejected' end,
    'bookings',
    p_booking_id,
    jsonb_build_object('notes', p_notes)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Keep profiles.updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.halls       enable row level security;
alter table public.bookings    enable row level security;
alter table public.events      enable row level security;
alter table public.notifications enable row level security;
alter table public.maintenance enable row level security;
alter table public.audit_logs  enable row level security;

-- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated
  using (auth.uid() = id and not public.is_admin())
  with check (auth.uid() = id and role = public.my_role());
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Allow admins to promote/demote others but never themselves (enforced in app too)
create policy profiles_admin_role_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- halls: everyone authenticated can browse; only admins can modify
create policy halls_select on public.halls for select to authenticated using (true);
create policy halls_admin_all on public.halls for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- bookings
create policy bookings_select on public.bookings for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy bookings_insert on public.bookings for insert to authenticated
  with check (auth.uid() = user_id and public.my_role() in ('student', 'faculty'));
create policy bookings_cancel_own on public.bookings for update to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled' and user_id = auth.uid());
create policy bookings_admin_update on public.bookings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy bookings_admin_delete on public.bookings for delete to authenticated
  using (public.is_admin());

-- events: readable by all, admin-managed
create policy events_select on public.events for select to authenticated using (true);
create policy events_admin_all on public.events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- notifications: strictly per-user
create policy notifications_select on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy notifications_update on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notifications_insert on public.notifications for insert to authenticated
  with check (auth.uid() = user_id);

-- maintenance: visible to all, admin-managed
create policy maintenance_select on public.maintenance for select to authenticated using (true);
create policy maintenance_admin_all on public.maintenance for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- audit logs: admin read-only
create policy audit_logs_select on public.audit_logs for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime: push changes to connected clients without refresh
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'bookings') then
    alter publication supabase_realtime add table public.bookings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'events') then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'maintenance') then
    alter publication supabase_realtime add table public.maintenance;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage bucket for hall images (optional — hall cards also accept any URL)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('hall-images', 'hall-images', true)
on conflict (id) do nothing;

create policy hall_images_public on storage.objects for select to public
  using (bucket_id = 'hall-images');
create policy hall_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'hall-images' and public.is_admin());
create policy hall_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'hall-images' and public.is_admin())
  with check (bucket_id = 'hall-images' and public.is_admin());
create policy hall_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'hall-images' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed data: the 8 college halls (idempotent — safe to re-run)
-- ---------------------------------------------------------------------------
insert into public.halls (name, description, capacity, location, image_url, facilities) values
('Sambram Hall',
 'The flagship auditorium of the college. A grand, fully air-conditioned hall with tiered seating, a professional stage, and broadcast-grade acoustics — the venue of choice for convocations, major conferences, and cultural nights.',
 1200, 'Main Block, Ground Floor',
 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80',
 array['Air Conditioning','Projector','Stage & Podium','Surround Sound','Wi-Fi','Live-Stream Ready']),

('Amphitheatre',
 'An open-air amphitheatre with sweeping tiered lawns under the sky. Perfect for freshers'' welcomes, music fests, theatre performances, and large outdoor gatherings.',
 1500, 'Central Campus, Open Air',
 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=80',
 array['Open Air','Tiered Lawn Seating','Outdoor PA System','Floodlights','Backstage Green Room']),

('Sadananda Hall',
 'A refined mid-size seminar hall with flexible seating layouts, ideal for department symposiums, guest lectures, and placement drives.',
 400, 'Science Block, First Floor',
 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80',
 array['Air Conditioning','Dual Projectors','Video Conferencing','Whiteboards','Wi-Fi']),

('Shambhavi Hall',
 'A warm, wood-panelled auditorium with excellent sightlines and natural acoustics, suited for lectures, debates, and classical music recitals.',
 350, 'Humanities Block, Second Floor',
 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80',
 array['Air Conditioning','Grand Piano','Projector','Recording Equipment']),

('Sowparnika Hall',
 'A bright, modern multipurpose hall with movable partitions that can split into two independent spaces for parallel workshops and club activities.',
 300, 'Student Activity Centre, Ground Floor',
 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80',
 array['Air Conditioning','Movable Partitions','Smart Boards','AV System','Wi-Fi']),

('Phalguni Hall',
 'A compact, well-equipped seminar room designed for focused sessions — project reviews, club meetings, and small-group presentations.',
 150, 'Library Annexe, First Floor',
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
 array['Air Conditioning','Interactive Display','Conference Phone','Wi-Fi']),

('Netravati Hall',
 'A versatile auditorium with retractable seating that converts into an exhibition floor — great for tech expos, job fairs, and large seminars.',
 500, 'Engineering Block, Ground Floor',
 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
 array['Air Conditioning','Retractable Seating','Exhibition Power Ports','PA System','Projector']),

('JKShim MBA Hall',
 'The executive venue of the MBA department — a sleek boardroom-style hall with a long conference table, telepresence suite, and lounge foyer for networking breaks.',
 80, 'JKShim Block, Third Floor',
 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80',
 array['Air Conditioning','Telepresence Suite','Boardroom Table','Lounge Foyer','Wi-Fi'])
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Sample upcoming events (idempotent)
-- ---------------------------------------------------------------------------
insert into public.events (title, description, hall_id, event_date, start_time, end_time, status)
select 'National Tech Fest 2026',
       'Flagship inter-college technology festival with hackathons, robotics demos, and tech talks.',
       h.id, current_date + 14, '09:00', '17:00', 'upcoming'
from public.halls h where h.name = 'Netravati Hall'
on conflict do nothing;

insert into public.events (title, description, hall_id, event_date, start_time, end_time, status)
select 'Annual Classical Music Evening',
       'An evening of Carnatic and Hindustani recitals in the warm acoustics of Shambhavi Hall.',
       h.id, current_date + 21, '18:00', '21:00', 'upcoming'
from public.halls h where h.name = 'Shambhavi Hall'
on conflict do nothing;

-- Done. To create your first ADMIN:
--   1. Register a normal account in the app.
--   2. Run: update public.profiles set role = 'admin' where email = 'you@college.edu';
