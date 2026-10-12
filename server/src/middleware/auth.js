import { verifyToken } from '../services/token.js';

// Express lowercases header names for req.header(), so 'authorization'
// matches regardless of how the client cased it.
function requireAuth(req, res, next) {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header.' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization header.' });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    // Covers both an expired token (TokenExpiredError) and a tampered or
    // malformed one (JsonWebTokenError), the client does not get to tell
    // which from the response, same spirit as auth.js's login error.
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export { requireAuth };
