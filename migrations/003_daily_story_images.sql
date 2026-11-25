alter table daily_stories
  add column if not exists image_mime text;

alter table daily_stories
  add column if not exists image_bytes bytea;
