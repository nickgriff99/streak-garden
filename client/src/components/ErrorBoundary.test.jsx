import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function Explode() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('shows a friendly fallback instead of blanking the page when a child throws', () => {
    // componentDidCatch logs to console.error on purpose; silence it here so
    // the expected-in-this-test crash doesn't spam the real test output.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Explode />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong. Try refreshing the page.')).toBeInTheDocument();
  });
});
