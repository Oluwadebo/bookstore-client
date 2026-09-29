# Bookstore Client (Storefront)

The customer-facing website for the online bookstore, built with **React, Vite and Tailwind CSS**.
It talks to the API in `../server`.

> **Status:** Step 2 of 6 - scaffold, brand colours, API helper, and login/signup/account pages.
> Shelves, search, book pages, cart and checkout arrive in the following steps.

## Requirements

- Node.js 20 or newer
- The API running (see `../server/README.md`)

## Quick start

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Start the server first (`cd ../server && npm run dev`). The home page shows a green
"Server and database connected" badge when everything is wired up.

To test on your phone, run `npm run dev -- --host`, then open the "Network" address
Vite prints (phone and computer must be on the same Wi-Fi).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with instant reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally to test it |

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Leave empty in development (Vite proxies `/api` to port 5000). In production, set to the live API URL. |

Anything starting with `VITE_` is public in the browser. Never put secrets here.

## Project structure

```
client/
├── index.html            page shell, viewport + meta tags
├── public/favicon.svg    placeholder icon (final logo comes in step 6)
├── vite.config.js        React + Tailwind plugins, dev proxy to the API
└── src/
    ├── main.jsx          React entry, router setup
    ├── App.jsx           route table (URL -> page)
    ├── index.css         Tailwind import + brand design tokens
    ├── lib/api.js        fetch wrapper for all API calls
    ├── context/AuthContext.jsx   signed-in user state: useAuth()
    ├── components/       Layout, Navbar, ProtectedRoute, FormField
    └── pages/            HomePage, LoginPage, SignupPage, AccountPage
```

## Authentication

`src/context/AuthContext.jsx` keeps track of who is signed in. In any component:

```jsx
const { user, loading, login, signup, logout } = useAuth();
```

To make a page members-only, wrap it in `<ProtectedRoute>` in `App.jsx` (add `adminOnly`
for admin pages). Visitors are sent to the login page and brought back afterwards.
This only controls what the UI shows: the server enforces real permissions.

## Changing the look

Brand colours and fonts live in the `@theme` block of `src/index.css`. Editing a value
there (for example `--color-coral`) updates every button, badge and heading that uses it.

## Responsive design

The site is built mobile-first with Tailwind breakpoints (`sm:` tablets, `lg:` desktops).
Design for the phone layout first, then add larger-screen rules. Test in Chrome, Safari and
Firefox, plus iOS Safari and Android Chrome, before each release.

## Deployment (summary)

1. Set `VITE_API_URL` to the live API address.
2. Run `npm run build` and upload the `dist/` folder to a static host (Vercel, Netlify,
   Cloudflare Pages).
3. Add a rewrite rule that sends all paths to `index.html`, so links like `/books/dracula`
   work when opened directly. Vercel and Netlify offer this in their settings.
4. Set the server's `CLIENT_URL` to the live site address.
