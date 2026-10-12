import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { computeGrowth } from '../utils/growth.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Postgres `date` columns come back from node-pg's own parser as a Date
// object built in the SERVER PROCESS's LOCAL timezone (pg-types calls this
// out directly: "Force YYYY-MM-DD dates to be parsed as local time"). That
// is fine on a UTC box, but on a server running west/east of UTC, local
// midnight can land on the WRONG side of a UTC day boundary and silently
// shift computeGrowth's day-math by one. Every query below casts
// `date::text` instead and this function builds the Date explicitly at UTC
// midnight, matching growth.js's own UTC-based daysBetween.
function parseDateColumn(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function todayUTCDateString(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

async function findHabitOwnership(habitId, userId) {
  const result = await pool.query('select id, user_id from habits where id = $1', [habitId]);
  const habit = result.rows[0];
  if (!habit) return { status: 404 };
  if (habit.user_id !== userId) return { status: 403 };
  return { status: 200, habit };
}

// Shared by every /:id route below so the 404-vs-403-vs-200 decision (and
// its error copy) is made in exactly one place.
async function requireOwnedHabit(req, res) {
  const { id } = req.params;
  if (!UUID_RE.test(id)) {
    res.status(404).json({ error: 'Habit not found.' });
    return null;
  }
  const ownership = await findHabitOwnership(id, req.user.id);
  if (ownership.status === 404) {
    res.status(404).json({ error: 'Habit not found.' });
    return null;
  }
  if (ownership.status === 403) {
    res.status(403).json({ error: 'This habit belongs to another user.' });
    return null;
  }
  return ownership.habit;
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const habitsResult = await pool.query(
      'select id, name from habits where user_id = $1 order by created_at asc',
      [req.user.id]
    );
    const habitIds = habitsResult.rows.map((row) => row.id);

    const checkinDatesByHabit = new Map();
    if (habitIds.length > 0) {
      const checkinsResult = await pool.query(
        'select habit_id, date::text as date from checkins where habit_id = any($1::uuid[])',
        [habitIds]
      );
      for (const row of checkinsResult.rows) {
        const dates = checkinDatesByHabit.get(row.habit_id) ?? [];
        dates.push(parseDateColumn(row.date));
        checkinDatesByHabit.set(row.habit_id, dates);
      }
    }

    const habits = habitsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      growth: computeGrowth(checkinDatesByHabit.get(row.id) ?? []),
    }));

    res.json({ habits });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Habit name is required.' });
    }

    const result = await pool.query(
      'insert into habits (user_id, name) values ($1, $2) returning id, name',
      [req.user.id, name.trim()]
    );
    const row = result.rows[0];

    res.status(201).json({
      habit: { id: row.id, name: row.name, growth: computeGrowth([]) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/checkins', requireAuth, async (req, res, next) => {
  try {
    const habit = await requireOwnedHabit(req, res);
    if (!habit) return;

    const result = await pool.query(
      'select id, date::text as date, created_at from checkins where habit_id = $1 order by date asc',
      [habit.id]
    );
    res.json({ checkins: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/checkins', requireAuth, async (req, res, next) => {
  try {
    const habit = await requireOwnedHabit(req, res);
    if (!habit) return;

    const today = todayUTCDateString();
    try {
      const result = await pool.query(
        'insert into checkins (habit_id, date) values ($1, $2) returning id, date::text as date, created_at',
        [habit.id, today]
      );
      res.status(201).json({ checkin: result.rows[0] });
    } catch (err) {
      // 23505 = unique_violation, from unique(habit_id, date). One checkin
      // per habit per day, a promise the schema itself enforces.
      if (err.code === '23505') {
        return res.status(409).json({ error: 'This habit already has a checkin for today.' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const habit = await requireOwnedHabit(req, res);
    if (!habit) return;

    await pool.query('delete from habits where id = $1', [habit.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
