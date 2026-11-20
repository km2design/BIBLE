-- Persist admin-only app settings (publish mode, image auto-gen, etc.)
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
