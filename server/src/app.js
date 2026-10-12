import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.js';
import habitsRouter from './routes/habits.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// A handful of attempts per window on signup/login specifically, the two
// routes an attacker would actually hammer (credential stuffing, account
// enumeration via signup's 409). Keyed on IP by default, which is the
// express-rate-limit default and good enough for this app's scale.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  // Full error (stack, DB detail, everything) goes to the server log only.
  // The client never sees more than a generic message, so a raw Postgres
  // error (which can contain SQL or connection detail) never reaches a
  // response body. Routes that want to control their own status/message
  // handle it themselves before calling next(err); anything that lands
  // here is unexpected by definition.
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

export default app;
