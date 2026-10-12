import { Router } from 'express';
import pool from '../db/pool.js';
import { hashPassword, verifyPassword } from '../services/password.js';
import { signToken } from '../services/token.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return 'A valid email is required.';
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

function toUserDTO(row) {
  return { id: row.id, email: row.email };
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const validationError = validateCredentials(email, password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await pool.query('select id from users where email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    let result;
    try {
      result = await pool.query(
        'insert into users (email, password_hash) values ($1, $2) returning id, email',
        [normalizedEmail, passwordHash]
      );
    } catch (err) {
      // 23505 = unique_violation, from unique(email). The select above does
      // not lock anything, so two signups for the same email can both pass
      // it before either insert lands; the schema's unique constraint is
      // what actually stops the second one. See habits.js's checkins
      // insert for the same pattern.
      if (err.code === '23505') {
        return res.status(409).json({ error: 'An account with that email already exists.' });
      }
      throw err;
    }
    const user = toUserDTO(result.rows[0]);
    const token = await signToken({ id: user.id, email: user.email });

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const validationError = validateCredentials(email, password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query(
      'select id, email, password_hash from users where email = $1',
      [normalizedEmail]
    );
    const row = result.rows[0];

    // Same generic message whether the email is unknown or the password is
    // wrong, deliberately, so a login attempt never confirms which account
    // exists. See the contract this file was handed: "don't leak which
    // field was wrong."
    const genericError = { error: 'Invalid email or password.' };
    if (!row) {
      return res.status(401).json(genericError);
    }

    const isValid = await verifyPassword(password, row.password_hash);
    if (!isValid) {
      return res.status(401).json(genericError);
    }

    const user = toUserDTO(row);
    const token = await signToken({ id: user.id, email: user.email });

    res.status(200).json({ user, token });
  } catch (err) {
    next(err);
  }
});

export default router;
