-- Streak Garden schema. Plain SQL, no ORM. Run against the DATABASE_URL
-- database once, in order, top to bottom (psql $DATABASE_URL -f schema.sql).
--
-- Growth stage/streak is never stored here on purpose. It is always
-- recomputed from checkins by server/src/utils/growth.js so there is one
-- source of truth and no stale-stage drift. See README.md "Growth stages".
--
-- To undo everything this file does, run the DROP block at the bottom of
-- this file instead (uncomment it and run it on its own). Kept in the same
-- file, commented out, so the rollback always matches whatever the create
-- block above it says, rather than drifting in a separate file.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Every habits list/detail read is "give me this user's habits", so index
-- the FK that filters it.
create index if not exists habits_user_id_idx on habits (user_id);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

-- Checkin history reads are always "give me this habit's checkins ordered
-- by date" for computeGrowth, so index the FK the same way as habits above.
-- The unique(habit_id, date) constraint above already gives us the index
-- Postgres needs for the 409-on-duplicate-checkin check, this one covers
-- the plain lookup-by-habit path.
create index if not exists checkins_habit_id_idx on checkins (habit_id);

-- --------------------------------------------------------------------------
-- Rollback (undo everything above). Uncomment and run on its own to tear
-- the schema back down. Order matters: children before parents.
-- --------------------------------------------------------------------------
-- drop table if exists checkins;
-- drop table if exists habits;
-- drop table if exists users;
