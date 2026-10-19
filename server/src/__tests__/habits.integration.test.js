import express from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// server/src/middleware/auth.js is Merry's to build (JWT verification).
// Sam's lane here is only the habits routes themselves, so this test's own
// stand-in requireAuth reads a plain test header instead of a real token,
// just enough to put a req.user.id on the request the same way the real
// middleware will. This mock lives only in this test file, it is not
// shipped as a production implementation.
vi.mock('../middleware/auth.js', () => ({
  requireAuth: (req, res, next) => {
    const userId = req.header('x-test-user-id');
    if (!userId) {
      return res.status(401).json({ error: 'Missing test auth header.' });
    }
    req.user = { id: userId };
    next();
  },
}));

const pool = (await import('../db/pool.js')).default;
const habitsRouter = (await import('../routes/habits.js')).default;

const app = express();
app.use(express.json());
app.use('/api/habits', habitsRouter);

async function createUser(email) {
  const result = await pool.query(
    "insert into users (email, password_hash) values ($1, 'test-hash') returning id",
    [email]
  );
  return result.rows[0].id;
}

async function createHabit(userId, name) {
  const result = await pool.query(
    'insert into habits (user_id, name) values ($1, $2) returning id',
    [userId, name]
  );
  return result.rows[0].id;
}

beforeAll(async () => {
  // Confirms the suite is actually talking to the real throwaway Postgres
  // container (DATABASE_URL set by the test run command), not silently
  // no-op-ing against nothing.
  await pool.query('select 1');
});

afterEach(async () => {
  await pool.query('truncate table checkins, habits, users cascade');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/habits/:id/checkins', () => {
  it('returns 409 when the habit already has a checkin for today', async () => {
    const userId = await createUser('waterer@example.com');
    const habitId = await createHabit(userId, 'Drink water');

    const first = await request(app)
      .post(`/api/habits/${habitId}/checkins`)
      .set('x-test-user-id', userId)
      .send({});
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/habits/${habitId}/checkins`)
      .set('x-test-user-id', userId)
      .send({});

    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: expect.any(String) });
  });
});

describe('ownership checks on another user\'s habit', () => {
  it('returns 403 when checking in on a habit owned by someone else', async () => {
    const ownerId = await createUser('owner@example.com');
    const otherId = await createUser('other@example.com');
    const habitId = await createHabit(ownerId, 'Read');

    const response = await request(app)
      .post(`/api/habits/${habitId}/checkins`)
      .set('x-test-user-id', otherId)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('returns 403 when deleting a habit owned by someone else', async () => {
    const ownerId = await createUser('owner2@example.com');
    const otherId = await createUser('other2@example.com');
    const habitId = await createHabit(ownerId, 'Stretch');

    const response = await request(app)
      .delete(`/api/habits/${habitId}`)
      .set('x-test-user-id', otherId);

    expect(response.status).toBe(403);

    // The habit must still exist afterward, a rejected delete is not a
    // partial delete.
    const stillThere = await pool.query('select id from habits where id = $1', [habitId]);
    expect(stillThere.rows).toHaveLength(1);
  });

  it('returns 404, not 403, when the habit does not exist at all', async () => {
    const userId = await createUser('lonely@example.com');
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app)
      .get(`/api/habits/${fakeId}/checkins`)
      .set('x-test-user-id', userId);

    expect(response.status).toBe(404);
  });
});

describe('GET /api/habits', () => {
  it('returns the species that was inserted for each habit', async () => {
    const userId = await createUser('lister@example.com');
    await request(app)
      .post('/api/habits')
      .set('x-test-user-id', userId)
      .send({ name: 'Water the cactus', species: 'cactus' });

    const response = await request(app).get('/api/habits').set('x-test-user-id', userId);

    expect(response.status).toBe(200);
    expect(response.body.habits).toHaveLength(1);
    expect(response.body.habits[0]).toMatchObject({
      name: 'Water the cactus',
      species: 'cactus',
    });
  });
});

describe('POST /api/habits name validation', () => {
  it('returns 400 and does not insert a row when name is over 100 characters', async () => {
    const userId = await createUser('longname@example.com');
    const tooLongName = 'a'.repeat(101);

    const response = await request(app)
      .post('/api/habits')
      .set('x-test-user-id', userId)
      .send({ name: tooLongName });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Habit name must be 100 characters or fewer.' });

    // A rejected create is not a partial create, no row should land.
    const countResult = await pool.query('select count(*) from habits where user_id = $1', [
      userId,
    ]);
    expect(Number(countResult.rows[0].count)).toBe(0);
  });
});

describe('POST /api/habits species validation', () => {
  it('round-trips a valid non-default species', async () => {
    const userId = await createUser('mushroom@example.com');

    const response = await request(app)
      .post('/api/habits')
      .set('x-test-user-id', userId)
      .send({ name: 'Forage', species: 'mushroom' });

    expect(response.status).toBe(201);
    expect(response.body.habit.species).toBe('mushroom');
  });

  it('defaults to sunflower when species is omitted', async () => {
    const userId = await createUser('defaulter@example.com');

    const response = await request(app)
      .post('/api/habits')
      .set('x-test-user-id', userId)
      .send({ name: 'Read' });

    expect(response.status).toBe(201);
    expect(response.body.habit.species).toBe('sunflower');
  });

  it('returns 400 and does not insert a row for an invalid species', async () => {
    const userId = await createUser('badspecies@example.com');

    const response = await request(app)
      .post('/api/habits')
      .set('x-test-user-id', userId)
      .send({ name: 'Nope', species: 'dragon' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Species must be one of: sunflower, cactus, mushroom, clover, bonsai.',
    });

    // A rejected create is not a partial create, no row should land.
    const countResult = await pool.query('select count(*) from habits where user_id = $1', [
      userId,
    ]);
    expect(Number(countResult.rows[0].count)).toBe(0);
  });
});
