# x402 Marketplace Frontend

React frontend for the x402 API marketplace. It lets users browse paid APIs, inspect endpoints, connect a wallet, authenticate with GitHub, manage provider listings, create API keys, and view usage and earnings.

## Stack

- React 19
- Vite
- React Router
- Wagmi
- Viem
- Lucide React

## What the App Does

- Browse marketplace listings
- Search and filter APIs by category
- View API details and test paid endpoints
- Login with GitHub through the backend OAuth flow
- Connect a wallet on Base Sepolia
- Create and manage provider listings
- Generate consumer API keys
- View usage history and provider earnings

## Local URLs

- Frontend dev server:
  `http://localhost:5173`

- Backend gateway used by the app:
  `http://localhost:8080`

The app currently calls the gateway directly from:

- [src/services/api.js](/C:/Users/kalfa/projectx402/x402-marketplace/frontend/src/services/api.js)
- [src/context/AuthContext.jsx](/C:/Users/kalfa/projectx402/x402-marketplace/frontend/src/context/AuthContext.jsx)

## Wallet Setup

Wallet connections are configured in:

- [src/config/wagmi.js](/C:/Users/kalfa/projectx402/x402-marketplace/frontend/src/config/wagmi.js)

Current setup:

- Chain: `baseSepolia`
- Connector: injected wallet
- RPC: `https://sepolia.base.org`

## Scripts

From `frontend/`:

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Project Structure

```text
frontend/
  src/
    assets/         Static assets
    components/     Reusable UI pieces
    config/         Wagmi and app config
    context/        Auth context and session state
    hooks/          API call and payment helpers
    pages/          Route-level screens
    services/       HTTP client functions
    styles/         Global and page-level styles
```

## Main Screens

- `Landing`
  Marketplace home, search, filters, featured stats, listing grid

- `ApiDetail`
  Endpoint details, request body input, payment flow, API response preview

- `CreateListing`
  Multi-step provider flow for publishing a paid API

- `MyApis`
  Provider dashboard for listing management

- `ApiKeys`
  Consumer API key creation and management

- `Usage`
  Consumer call history

- `Earnings`
  Provider revenue summary and recent transactions

## Auth Flow

The frontend uses GitHub login through the backend:

1. User clicks login
2. Browser is redirected to the backend OAuth route
3. Backend completes GitHub auth
4. Frontend exchanges the returned code for tokens
5. Refresh token is stored in local storage under `x402_refresh_token`

Relevant file:

- [src/context/AuthContext.jsx](/C:/Users/kalfa/projectx402/x402-marketplace/frontend/src/context/AuthContext.jsx)

## Build Notes

- The app builds successfully with `npm run build`
- Styling is plain CSS, not Tailwind or a component framework
- The frontend assumes the backend gateway is already running on port `8080`

## UI Notes

The current UI was refreshed toward:

- stronger visual hierarchy
- more marketplace-specific cards and dashboards
- responsive layouts for smaller screens
- cleaner CTA paths for provider and consumer flows

If you want to keep pushing the polish, the next best step is motion design rather than another full visual rewrite.
