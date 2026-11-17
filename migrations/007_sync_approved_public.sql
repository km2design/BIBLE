-- Remove non-approved public street content from the sync cutover date onward.
-- Mode B (approve_required) is applied by runtime ensurePublicSyncOnce (Postgres only)
-- or Admin「同步公開」— not here — so local PGlite smoke keeps Mode A defaults.
-- Approved + draft rows are kept; runtime sync refreshes stale pre-茶記 approved payloads.
delete from daily_stories
where story_date >= '2026-11-18'::date
  and source in ('sample', 'grok', 'pending');
