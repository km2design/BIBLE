-- Illustrated daily archive starts on 2026-11-16 with 「一句夠用」.
-- Drop earlier story rows and their comments so history only begins there.
delete from comments where story_date < date '2026-11-16';
delete from daily_stories where story_date < date '2026-11-16';

-- Clear stale sample payloads for day one so rewritten (non-doll) copy can be served.
delete from daily_stories
 where story_date = date '2026-11-16'
   and source = 'sample';
