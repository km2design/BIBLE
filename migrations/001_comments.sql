create table if not exists comments (
  id bigserial primary key,
  story_date date not null,
  nickname text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_story_date_idx on comments (story_date, created_at desc);
