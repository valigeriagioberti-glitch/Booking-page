import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Stripe redirect hardening for HashRouter.
// If Stripe returns to a non-hash route like /success/<id> or /cancel,
// convert it to the equivalent hash route so React Router matches.
(() => {
  const { pathname, search, hash } = window.location;
  if (hash && hash.startsWith('#/')) return;

  const m = pathname.match(/^\/success\/(.+)$/);
  if (m?.[1]) {
    window.location.replace(`/#/success/${encodeURIComponent(m[1])}${search || ''}`);
    return;
  }

  if (pathname === '/cancel') {
    window.location.replace(`/#/cancel${search || ''}`);
  }
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);