import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Without test.globals enabled, @testing-library/react's own auto-cleanup
// never finds a global afterEach to hook into, so each render() in a file
// piles up in the same jsdom document instead of being unmounted between
// tests. One explicit cleanup here covers every test file.
afterEach(() => {
  cleanup();
});
