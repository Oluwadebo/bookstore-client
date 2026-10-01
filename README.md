# Bookstore Client (Storefront)

The customer-facing website for the online bookstore, built with **React, Vite and Tailwind CSS**.
It talks to the API in `../server`.

> **Status:** Step 5 of 6 - storefront, login/signup, cart, checkout, customer library, and the
> admin area with owner-approved admins. Final polish and hand-off come next.

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
    ├── lib/
    │   ├── api.js        fetch wrapper for all API calls
    │   ├── useApi.js     hook: load data from the API
    │   ├── format.js     price formatting
    │   ├── roles.js      isStaff / isOwner helpers
    │   └── usePageTitle.js  browser tab titles
    ├── context/
    │   ├── AuthContext.jsx   signed-in user state: useAuth()
    │   └── CartContext.jsx   shopping cart (guest + signed-in): useCart()
    ├── components/       Layout, Navbar, SearchBar, BookCard, BookGrid, BookGridSkeleton, BookCover,
    │                     CategoryChips, Pagination, AddToCartButton, ProtectedRoute, FormField,
    │                     ErrorBoundary, Modal, ConfirmProvider, PasswordField, AdminApplyCard,
    │                     admin/ (AdminLayout, FileUpload)
    └── pages/            HomePage, BrowsePage, BookPage, CartPage, CheckoutCompletePage,
                          LibraryPage, LoginPage, SignupPage, AccountPage,
                          admin/ (Dashboard, Books, BookForm, Categories, Orders, Team)
```

## Storefront pages

| URL | Page |
|---|---|
| `/` | Hero with search, shelves, featured books, new arrivals |
| `/browse` | All books. `?search=`, `?sort=` and `?page=` are read from the address |
| `/category/:slug` | One shelf (same page as `/browse`, filtered) |
| `/books/:slug` | Book details, Add to cart, related titles |
| `/cart` | Cart and checkout button |
| `/checkout/complete` | Where the payment page returns the customer (members only) |
| `/library` | Purchased books with download buttons (members only) |
| `/admin` | Admin dashboard (admins only). Sub-pages: `/admin/books`, `/admin/books/new`, `/admin/books/:id`, `/admin/categories`, and `/admin/orders` and `/admin/team` (both owner only) |

Shelves, chips and menus come from the database, so adding a category (for example a
non-fiction or educational shelf) makes it appear everywhere with no code change.
Books without a cover image get a colourful generated cover, so the shelves always look lively.

## Search engines and link previews

`index.html` holds the default title, meta description (about 150 characters, the length search
engines show before cutting off) and Open Graph tags for link previews. Book and shelf pages set their
own description with `usePageTitle(title, description)`. Because the site is a single-page app, link
previews on WhatsApp and Facebook read only `index.html`, so every shared link shows the home-page text
and image. Per-page previews would need server-side rendering or pre-rendering. An `og:image`
(the logo) is added with the branding in step 6.

## UI conventions (please keep these)

- **Never use the browser's `window.confirm`, `alert` or `prompt`.** Use the designed pop-ups:
  - Yes/no questions: `const confirm = useConfirm();` then
    `if (!(await confirm({ title, message, confirmLabel, danger: true }))) return;`
  - Anything with a form or custom content: `<Modal open onClose title>...</Modal>`.
  Both handle Escape, backdrop click, keyboard focus and screen readers for you.
- **Every password field uses `<PasswordField>`**, which adds the eye button to show or hide the password.
- Roles: use `isStaff(user)` and `isOwner(user)` from `src/lib/roles.js`. They only decide what to
  *show*; the server decides what is actually allowed.

## Admin area

Reached at `/admin` (an "Admin" link appears in the header for admin accounts). The screens are
Dashboard, Books (list, add, edit, upload cover and file, publish), Shelves, and Orders.
Admins and the owner can use it; customers can't. A regular admin only sees the books and shelves they created. The owner sees everything, and alone has Orders, Team, and deleting books and shelves.
Access is checked twice: the page hides itself from non-admins, and the server refuses admin
requests from anyone who isn't an admin. See `../docs/ADMIN-GUIDE.md` for the store owner's guide.

Uploads use `src/lib/api.js` `upload()`, which reports progress so large book files show a
moving percentage bar.

## Cart and checkout

`src/context/CartContext.jsx` provides `useCart()`. Visitors who are not signed in keep their cart in
the browser, so they can shop first. When they log in, that cart is merged into their account cart,
which then follows them to any device.

At checkout the server rebuilds the order from its own prices, so the numbers shown in the browser
are for display only. The customer pays on the payment provider's page and returns to
`/checkout/complete`, which confirms the payment with the server (re-checking for up to about
12 seconds for slow bank confirmations) before showing the books.

Downloads: the Download button asks the server for a link that works for 5 minutes, then the
browser saves the file.

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
