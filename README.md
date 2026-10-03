# Bookstore Client (Storefront)

The customer-facing website for the online bookstore, built with **React, Vite and Tailwind CSS**.
It talks to the API in `../server`.

> **Status:** Step 5 of 6 - storefront, login/signup (with password reset), cart with processing fee, checkout,
> customer library, and a marketplace admin area (sellers, commission, earnings, statements, payouts, shelf
> requests). Final polish and hand-off come next.

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
    │                     Loading (all loading states), admin/ (AdminLayout, FileUpload, FileDetailsModal)
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
| `/admin` | Admin dashboard (admins only). Sub-pages: `/admin/books`, `/admin/books/new`, `/admin/books/:id`, `/admin/categories`, `/admin/sales` (an admin's own earnings), and `/admin/orders`, `/admin/earnings`, `/admin/earnings/:sellerId` and `/admin/team` (all owner only). Public: `/forgot-password` and `/reset-password` |

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
- **Never write a plain "Loading..." line.** Use the components in `src/components/Loading.jsx`:
  `PageLoader` (whole page), `Skeleton*` placeholders shaped like each screen, `BusyLabel` (spinner inside a
  button), and the slim `TopLoadingBar` that already appears whenever the app waits on the server.
  Make a skeleton look like the real content so nothing jumps when the data arrives.
- **Every password field uses `<PasswordField>`**, which adds the eye button to show or hide the password.
- Roles: use `isStaff(user)` and `isOwner(user)` from `src/lib/roles.js`. They only decide what to
  *show*; the server decides what is actually allowed.

## Admin area

Reached at `/admin` (an "Admin" link appears in the header for admin accounts). The screens are
Dashboard, Books (list, add, edit, upload cover and file, publish), Shelves, and My sales for admins; the owner
also has Orders, Earnings and Team. Admins and the owner can use it; customers can't. A regular admin only sees
the books they created and can only look at shelves (requesting new ones). Only the owner creates shelves, deletes
books, sees orders, sets the commission, records payouts and approves admins. The earnings pages print cleanly
(header, tabs and buttons hide themselves with `print:hidden`) and statements download as CSV.
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
