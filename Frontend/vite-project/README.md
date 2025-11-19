# Mr. Parathas Frontend

Modern, responsive single-page application for the Mr. Parathas restaurant. The UI is built with React (Vite) and integrates with the existing Node/Express backend via REST APIs for menu data, reservations, contact messages and optional admin workflows.

## Features

- Public pages for Home, Menu, Reservations and Contact with fully responsive layouts
- User authentication with self-serve signup + login plus optional admin access
- Reservation form with real-time table availability, loading/error states and success messaging
- Contact page with structured details, embedded map, and API-backed contact form
- Admin dashboard (optional access) for logging in, creating menu items, viewing reservations and reading contact messages
- React Router SPA navigation, global layout with accessible header/footer, and shared UI building blocks
- Axios API client with base URL selection via environment variable and standardized error handling

## Requirements

- Node.js 18+
- npm (included with Node)
- Backend API running locally or accessible over the network

## Environment variables

Create a `.env` file in `Frontend/vite-project` with the backend URL:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

You can point this to any deployed backend by changing the value.

## Getting started

```bash
cd Frontend/vite-project
npm install
npm start
```

`npm start` runs Vite in dev mode with hot reloading at http://localhost:5173.

## Available scripts

- `npm start` / `npm run dev` – start the development server
- `npm run build` – generate a production build in `dist`
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint on the project

## Project structure

```
src/
  components/        Reusable UI widgets, layout, admin, forms
  pages/             Route-level screens (home, menu, reservations, contact, admin)
  hooks/             React Query data hooks
  services/          Axios client configuration
  context/           Auth storage for admin login
  routes/            SPA route definitions
```

## Connecting to the backend

All data requests are made through `src/services/apiClient.js`. Ensure the backend server is running and the `VITE_API_BASE_URL` matches its API root. The client automatically forwards stored admin tokens for protected endpoints.

## Authentication & accounts

- Visit `/auth` (or click “Sign in” in the header) to log in or create a new customer account.
- New registrations immediately receive access and refresh tokens so the user stays signed in.
- Admins can also log in from the same page; the navigation reveals links to the admin dashboard when the signed-in user has the `admin` role.
- Auth state persists in `localStorage` and HTTP-only cookies so refreshes keep the user logged in.

## Production build

```bash
npm run build
# optional: preview the static build
npm run preview
```

Deploy the contents of the generated `dist` directory behind any static host (Netlify, Vercel, Nginx, etc). The app will continue to call the configured backend API for dynamic data.
