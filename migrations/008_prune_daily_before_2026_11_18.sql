-- Public daily archive now starts on 2026-11-18 (Admin-approved cutover).
-- Drop 2026-11-16 / 2026-11-17 (and any earlier) stories + comments.
delete from comments where story_date < date '2026-11-18';
delete from daily_stories where story_date < date '2026-11-18';
