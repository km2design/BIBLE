alter table comments
  add column if not exists parent_id bigint references comments (id) on delete set null;

alter table comments
  add column if not exists is_admin boolean not null default false;

create index if not exists comments_parent_id_idx on comments (parent_id);
