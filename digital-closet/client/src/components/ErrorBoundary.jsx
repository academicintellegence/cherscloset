import { Component } from 'react';

// Catches render errors so one broken screen never leaves a blank page.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="empty" role="alert">
        <p>Something went wrong on this screen. Your closet is safe.</p>
        <button className="primary" onClick={() => this.setState({ failed: false })}>Try again</button>
        <button className="secondary" onClick={() => window.location.reload()}>Reload the app</button>
      </div>
    );
  }
}
