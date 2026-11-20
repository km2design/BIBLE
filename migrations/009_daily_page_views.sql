-- Simple per-day public daily-story view counters for admin usage stats.
create table if not exists daily_page_views (
  story_date date primary key,
  views integer not null default 0 check (views >= 0),
  updated_at timestamptz not null default now()
);
