import bcrypt from 'bcrypt';

// 12 rounds is a reasonable default for bcrypt in 2026: slow enough to resist
// offline brute force on a leaked hash, fast enough not to be felt on a
// single signup/login request.
const SALT_ROUNDS = 12;

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export { hashPassword, verifyPassword };
