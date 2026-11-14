create table if not exists daily_stories (
  story_date date primary key,
  payload jsonb not null,
  source text not null,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  id bigserial primary key,
  bucket text not null,
  hit_at timestamptz not null default now()
);

create index if not exists rate_limits_bucket_hit_idx on rate_limits (bucket, hit_at desc);
