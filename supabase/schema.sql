-- ============================================================
-- Document Tracking System - Supabase (Postgres) schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run
-- ============================================================

-- ---------- Departments ----------
create table if not exists departments (
  id serial primary key,
  name text not null
);

insert into departments (name) values ('Registrar'), ('Finance'), ('IT Department');

-- ---------- Profiles ----------
-- One row per Supabase Auth user, holding the app-specific fields
-- (name, role, department) that auth.users doesn't have.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'submitter' check (role in ('admin', 'staff', 'submitter')),
  department_id int references departments(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------- Documents ----------
create table if not exists documents (
  id serial primary key,
  tracking_code text not null unique,       -- e.g. DOC-2026-0001
  title text not null,
  doc_type text not null,
  description text,
  mode text not null check (mode in ('physical', 'digital')),
  file_path text,                           -- Supabase Storage path, digital only
  submitted_by uuid not null references profiles(id),
  current_holder uuid not null references profiles(id),
  status text not null default 'submitted' check (
    status in ('submitted', 'in_transit', 'received', 'under_review',
               'approved', 'rejected', 'returned', 'archived')
  ),
  created_at timestamptz default now()
);

-- ---------- Document logs (the audit trail) ----------
-- One row per movement/action. Never updated or deleted.
create table if not exists document_logs (
  id serial primary key,
  document_id int not null references documents(id) on delete cascade,
  from_user uuid references profiles(id),
  to_user uuid references profiles(id),
  action text not null,
  remarks text,
  created_at timestamptz default now()
);

-- ---------- Tracking-code generator ----------
-- A sequence-backed function avoids the race condition you'd get from
-- "SELECT count(*) + 1" if two people register a document at the same instant.
create sequence if not exists tracking_code_seq start 1;

create or replace function generate_tracking_code()
returns text
language sql
as $$
  select 'DOC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('tracking_code_seq')::text, 4, '0');
$$;

-- ============================================================
-- Row Level Security
-- The app's server code talks to these tables using the Supabase
-- SERVICE ROLE key (server-only, never sent to the browser), which
-- bypasses RLS by design. Enabling RLS here with NO policies means
-- the public/anon key (the one that could theoretically leak to the
-- browser) cannot read or write anything - defense in depth.
-- ============================================================
alter table departments enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_logs enable row level security;

-- ============================================================
-- Storage bucket for uploaded (digital) documents
-- Kept private; the app generates short-lived signed URLs to view files.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents-files', 'documents-files', false)
on conflict (id) do nothing;
