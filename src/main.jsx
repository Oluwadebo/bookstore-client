/**
 * React entry point.
 * - BrowserRouter enables page navigation without full page reloads.
 * - AuthProvider makes the signed-in user available to every component.
 * - CartProvider (inside AuthProvider) keeps the shopping cart for guests and customers.
 * - ConfirmProvider powers useConfirm(): designed yes/no pop-ups instead of window.confirm.
 * - ErrorBoundary shows a friendly message (not a blank page) if a page crashes.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ConfirmProvider } from "./components/ConfirmProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ConfirmProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ConfirmProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
