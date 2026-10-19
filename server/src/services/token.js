import jwt from 'jsonwebtoken';

// Session length for the JWT. Short enough that a leaked token does not
// stay valid forever, long enough that a user is not logged out mid-week.
// There is no refresh token in this app, a user who stays logged in past
// this just has to log back in.
const TOKEN_TTL = '7d';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set.');
  }
  return secret;
}

function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

// Throws (jwt.verify's own TokenExpiredError / JsonWebTokenError) on a
// missing/invalid/expired token. requireAuth is the one place that catches
// it, so expiry is enforced by the library itself, not by this app
// re-checking an "exp" field by hand.
function verifyToken(token) {
  // signToken above never passes an algorithm option, so jsonwebtoken signs
  // with its default, HS256. Pin verify to the same so a future change to
  // this file (or a crafted token with an "alg" header) can't silently
  // widen what gets accepted here.
  return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
}

export { signToken, verifyToken };
