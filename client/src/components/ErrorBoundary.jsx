import { Component } from 'react';

// Plain class component on purpose. React has no hook equivalent for catching
// render-time errors in children, getDerivedStateFromError/componentDidCatch
// only exist on classes. Without this, one bad render anywhere under
// <Routes> blanks the whole page for a visitor with nothing on screen.
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <p className="form-error">Something went wrong. Try refreshing the page.</p>;
    }
    return this.props.children;
  }
}
