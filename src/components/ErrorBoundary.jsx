/**
 * Catches errors thrown while rendering any page and shows a friendly message
 * instead of a blank screen. In development it also shows the technical error
 * text on the page, which makes bugs much faster to find. Visitors on the live
 * site only see the friendly message.
 *
 * (React only supports this as a class component.)
 */
import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3">Sorry about that. Please go back and try again.</p>
        {import.meta.env.DEV && (
          <pre className="mt-6 overflow-x-auto rounded-xl bg-white p-4 text-left text-xs">{String(error.stack || error.message)}</pre>
        )}
        <a href="/" className="mt-6 inline-block rounded-full bg-coral px-6 py-3 font-semibold text-navy">
          Back to home
        </a>
      </main>
    );
  }
}
