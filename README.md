# x402 API Marketplace

A crypto-native API marketplace where providers sell access to their APIs and consumers pay per call in USDC on Base Sepolia. Built around the HTTP 402 Payment Required status code — the forgotten HTTP status that was designed for exactly this.

## What is this?

I built this as a personal project to learn microservices, blockchain integration, and reactive programming. The idea is simple: what if paying for an API call was as easy as making the call itself?

A provider registers their API on the marketplace, sets a price per call (say 0.001 USDC), and the platform handles everything — payment verification, request forwarding, usage tracking. Consumers either pay through MetaMask in the browser or use the SDK to automate payments from their own backend.

The whole flow works like this:

```
Consumer calls API → Gateway returns 402 "Payment Required"
                   → Consumer sends USDC on Base Sepolia
                   → Retries with the transaction hash
                   → Gateway verifies payment on-chain
                   → Forwards request to provider's real API
                   → Consumer gets the response
```

No middlemen holding funds. No monthly subscriptions. No invoicing. Just pay and use.

## Architecture

```
React Frontend (5173)
        │
        ▼
┌──────────────────────┐
│    API Gateway        │
│    (port 8080)        │
│                       │
│  JWT / API Key auth   │
│  x402 payment filter  │
│  Rate limiting        │
│  Request forwarding   │
└───┬──────┬──────┬─────┘
    │      │      │
    ▼      ▼      ▼
┌───────┐ ┌───────┐ ┌──────────┐
│ auth  │ │provid.│ │ payment  │
│ 8081  │ │ 8082  │ │  8083    │
└───┬───┘ └───┬───┘ └────┬─────┘
    │         │           │
    ▼         ▼           ▼
  MySQL    MySQL    Base Sepolia
  Redis    Redis    (blockchain)
           Cache
                    RabbitMQ
```

Four Spring Boot services behind a reactive API Gateway, with Redis for caching and rate limiting, RabbitMQ for async usage logging, and Web3j for on-chain payment verification.

## Tech Stack

**Backend**
- Java 17+ / Spring Boot 3.5
- Spring Cloud Gateway (Netty/reactive)
- Spring Security + OAuth2 Client
- Spring Data JPA + MySQL
- Web3j for blockchain interaction
- Redis for caching + rate limiting + replay prevention
- RabbitMQ for async event processing
- JWT (jjwt) for authentication

**Frontend**
- React 18 + Vite
- React Router v6
- wagmi + viem for wallet integration
- ethers.js (in SDK)

**Blockchain**
- Base Sepolia testnet
- USDC (ERC-20) for payments
- MetaMask for browser wallet

## How to Run

### Prerequisites

- Java 17+ (I use JDK 25)
- Node.js 18+
- MySQL (I use XAMPP)
- Docker (for Redis and RabbitMQ)
- MetaMask browser extension
- A GitHub OAuth App (for login)

### 1. Clone and setup

```bash
git clone https://github.com/yourusername/x402-marketplace.git
cd x402-marketplace
```

### 2. Start infrastructure

```bash
docker run -d -p 6379:6379 --name redis redis
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:management
```

Start MySQL through XAMPP. The database `x402_auth` will be created automatically by Hibernate.

### 3. Create a GitHub OAuth App

Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App:
- Application name: anything
- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:8081/login/oauth2/code/github`

Copy the Client ID and Client Secret.

### 4. Set environment variables

Each service needs these in its IntelliJ run configuration (or as system env vars):

**All services:**
```
JWT_SECRET=your-secret-key-at-least-64-characters-long
INTERNAL_API_KEY=any-shared-secret-between-services
```

**auth-service only:**
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 5. Build and run

```bash
mvn clean install -DskipTests
```

Start services in this order:
1. auth-service (port 8081)
2. provider-service (port 8082)
3. payment-service (port 8083)
4. api-gateway (port 8080)

Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` — you should see the marketplace.

### 6. Get testnet tokens

You need test USDC and test ETH on Base Sepolia:
- Test ETH: [Coinbase CDP Faucet](https://portal.cdp.coinbase.com/products/faucet)
- Test USDC: [Circle Faucet](https://faucet.circle.com/)

Add Base Sepolia to MetaMask:
- Network: Base Sepolia
- RPC: `https://sepolia.base.org`
- Chain ID: 84532

## Features

### For consumers (API users)

- Browse and search the marketplace without logging in
- Login with GitHub (OAuth2)
- Connect MetaMask wallet
- Call any API — MetaMask pops up automatically for payment
- View usage history and payment records
- Generate long-lived API keys for programmatic access

### For providers (API sellers)

- Register APIs with a base URL and endpoint configuration
- Set per-call pricing in USDC
- Protect your API with a provider key (injected by the Gateway, invisible to consumers)
- View earnings dashboard
- Pause/activate listings
- API reachability verification before going live

### For developers (SDK users)

```bash
cd sdk
npm install
```

```javascript
const { X402Client } = require('./src/index');

const client = new X402Client({
  apiKey: 'x402_sk_your_key_here',
  baseUrl: 'http://localhost:8080',
  privateKey: '0xYourPrivateKey',  // for auto-payments
});

// one line — handles 402, pays USDC, retries automatically
const joke = await client.get(5, '/random_joke');
console.log(joke);
```

The SDK also supports calling APIs by name instead of ID:

```javascript
const result = await client.getByName('Random Joke API', '/random_joke');
```

## Security

This project implements several layers of security that I learned to build from scratch:

**Authentication & Authorization**
- OAuth2 with GitHub (and Google ready) via Spring Security
- JWT access tokens (15 min) + refresh tokens (7 days) with rotation
- Stolen refresh token detection — if a used token is reused, all tokens for that user are revoked
- One-time auth code exchange pattern (tokens never appear in URLs)
- Consumer API keys for programmatic access (`x402_sk_` prefix)

**Payment Security**
- 3-tier replay prevention: Redis SET NX lock → database check → unique constraint
- On-chain verification via Web3j (parses ERC-20 Transfer event logs)
- Provider API key injection — consumers never see the provider's secret key
- Internal service-to-service authentication with shared API key

**Gateway Security**
- JWT and API key validation at the edge
- Rate limiting per user/IP with Redis (configurable per route)
- Header stripping — consumer credentials (JWT, API key, payment hash) never reach the provider
- CORS managed centrally, provider CORS headers stripped to prevent duplicates
- Request body forwarding with proper streaming

**Caching**
- Redis `@Cacheable` on endpoint lookups and wallet lookups (5 min TTL)
- `@CacheEvict` on updates so stale data is cleared immediately
- JSON serialization so cached data is human-readable in Redis

## Project Structure

```
x402-marketplace/
├── auth-service/          OAuth2, JWT, user management, API keys, wallet
├── provider-service/      API/endpoint CRUD, marketplace, discovery
├── payment-service/       Blockchain verification, usage logs, earnings
├── api-gateway/           Routing, JWT filter, x402 filter, rate limiting
├── common/                Shared DTOs, exceptions, JWT filter, API key validator
├── frontend/              React marketplace UI
├── sdk/                   JavaScript SDK for developers
└── pom.xml                Parent POM (Maven multi-module)
```

## API Endpoints

### Auth Service (via Gateway on 8080)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /oauth2/authorization/github | Public | Start GitHub login |
| POST | /api/auth/exchange | Public | Exchange one-time code for JWT |
| POST | /api/auth/refresh | Public | Refresh access token |
| GET | /api/auth/me | JWT | Get current user profile |
| PATCH | /api/auth/wallet | JWT | Link wallet address |
| POST | /api/auth/keys | JWT | Generate API key |
| GET | /api/auth/keys | JWT | List my API keys |
| DELETE | /api/auth/keys/{id} | JWT | Deactivate an API key |

### Provider Service

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/marketplace | Public | Browse active APIs |
| GET | /api/marketplace/{id} | Public | View API details |
| POST | /api/provider/apis | JWT | Register new API |
| GET | /api/provider/apis/mine | JWT | List my APIs |
| PUT | /api/provider/apis/{id} | JWT | Update API |
| PATCH | /api/provider/apis/{id}/status | JWT | Activate/pause API |
| POST | /api/provider/apis/{id}/endpoints | JWT | Add endpoint |
| DELETE | /api/provider/endpoints/{id} | JWT | Delete endpoint |

### Payment Flow

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/call/{endpointId}/{path} | JWT/Key | Call API (returns 402 if unpaid) |
| GET | /api/call/{endpointId}/{path} | JWT/Key + X-402-Payment | Call API with payment proof |
| GET | /api/pay/usage/me | JWT | My usage history |
| GET | /api/pay/earnings/me | JWT | My earnings as provider |

## The x402 Protocol

When a consumer calls a paid endpoint without payment, the Gateway returns:

```json
{
  "x402": {
    "version": 1,
    "price": "0.001",
    "currency": "USDC",
    "network": "base-sepolia",
    "payTo": "0xProviderWalletAddress",
    "endpointId": 5
  }
}
```

The consumer sends USDC to the `payTo` address, then retries the same request with the transaction hash in the `X-402-Payment` header. The Gateway verifies the payment on-chain and forwards the request to the provider.

## Environment Variables Reference

| Variable | Services | Description |
|----------|----------|-------------|
| JWT_SECRET | All 4 | Shared JWT signing key (64+ chars) |
| INTERNAL_API_KEY | All 4 | Service-to-service auth |
| GITHUB_CLIENT_ID | auth-service | GitHub OAuth app |
| GITHUB_CLIENT_SECRET | auth-service | GitHub OAuth app |

## What I Learned Building This

This project forced me to understand things I couldn't learn from tutorials:

- Why reactive (WebFlux/Netty) and servlet (Tomcat) can't coexist in the same module
- How Spring Security's OAuth2 filters work under the hood — they're not controllers
- Why `@Cacheable` doesn't work with `Mono<T>` in reactive code
- The difference between `RestTemplate` (blocking) and `WebClient` (non-blocking) and when each is appropriate
- How ERC-20 Transfer events are structured on-chain and how to parse them with Web3j
- Why CORS headers from the provider must be stripped when the Gateway adds its own
- How refresh token rotation with stolen token detection actually works in production
- The race condition in replay prevention and why Redis SET NX is needed alongside database checks

## Future Plans

- Prepaid balance system (deposit USDC once, auto-deduct per call)
- Automated provider withdrawals via Web3j
- Docker + docker-compose for deployment
- Mainnet migration (3 config values to change)

## License

MIT

---

Built by Kostas ([@kodaku12](https://github.com/Kalfask)) as a learning project at the University of Macedonia, Department of Applied Informatics.
