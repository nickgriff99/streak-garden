import express from 'express';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

// Unlike habits.integration.test.js, nothing here needs to mock
// middleware/auth.js, signup/login never touch requireAuth. This exercises
// the real password.js and token.js Merry built, not stand-ins.
const pool = (await import('../db/pool.js')).default;
const authRouter = (await import('../routes/auth.js')).default;

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

beforeAll(async () => {
  await pool.query('select 1');
});

afterEach(async () => {
  await pool.query('truncate table checkins, habits, users cascade');
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/signup', () => {
  it('creates an account and returns a user and token', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'new-gardener@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({
      id: expect.any(String),
      email: 'new-gardener@example.com',
    });
    expect(typeof response.body.token).toBe('string');
    // password_hash must never leave the server.
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it('returns 409 for an email that already has an account', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'password123' });

    const second = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'dupe@example.com', password: 'a-different-password' });

    expect(second.status).toBe(409);
    expect(second.body).toEqual({ error: expect.any(String) });
  });

  it('returns 400 for a password over the max length', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'too-long-password@example.com', password: 'a'.repeat(129) });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  // Real edge case, not a padding test: the existence check and the insert
  // are two separate round trips with no transaction or advisory lock
  // between them, so two signups for the same email arriving at the same
  // time both pass the existence check before either one's insert lands.
  // The schema's own unique(email) constraint is the only thing that
  // actually stops the second insert, and auth.js's insert (unlike
  // habits.js's checkins insert, which explicitly catches this exact
  // 23505 unique_violation for the same reason) has no catch for it. See
  // this round's report for the real failure this produces.
  it('still answers 409, not a raw 500, when two signups for the same email race', async () => {
    const email = 'racer@example.com';

    const [first, second] = await Promise.all([
      request(app).post('/api/auth/signup').send({ email, password: 'password123' }),
      request(app).post('/api/auth/signup').send({ email, password: 'password123' }),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 for a correct email with the wrong password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'wrong-password@example.com', password: 'correct-password' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong-password@example.com', password: 'incorrect-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: expect.any(String) });
  });
});
