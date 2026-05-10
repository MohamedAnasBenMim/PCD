create extension if not exists pgcrypto;

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  scan_id text not null unique,
  patient_id text not null,
  patient_name text,
  scan_type text not null,
  eye text not null,
  notes text,
  original_filename text not null,
  mime_type text not null,
  file_size integer not null,
  severity text not null,
  confidence numeric(5, 2) not null,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists detected_features (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  name text not null,
  detected boolean not null,
  confidence numeric(5, 2) not null
);

create index if not exists scans_patient_id_idx on scans(patient_id);
create index if not exists scans_analyzed_at_idx on scans(analyzed_at desc);
create index if not exists detected_features_scan_id_idx on detected_features(scan_id);

-- Users table for authentication
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  first_name text,
  last_name text,
  organization text,
  created_at timestamptz not null default now()
);

create index if not exists users_email_idx on users(email);
