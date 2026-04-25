# x402 Marketplace Backend

Monorepo for an API marketplace built around HTTP `402 Payment Required`, GitHub OAuth login, wallet linking, and USDC payments on Base Sepolia.

This README documents the backend and shared infrastructure only. The frontend has its own guide in [frontend/README.md](/C:/Users/kalfa/projectx402/x402-marketplace/frontend/README.md).

## Stack

- Java 17
- Spring Boot 3
- Spring Cloud Gateway
- MySQL
- Redis
- RabbitMQ
- JWT auth
- GitHub OAuth2
- Web3j for onchain payment verification

## Modules

- `api-gateway`
  Reverse proxy on port `8080`. Routes requests to the internal services, applies Redis-based rate limiting, and exposes `/health`.

- `auth-service`
  Runs on port `8081`. Handles GitHub OAuth, JWT issuing and refresh, current-user lookup, role updates, wallet linking, and consumer API key management.

- `provider-service`
  Runs on port `8082`. Handles provider API listings, endpoint CRUD, marketplace browsing, and internal endpoint lookup for paid requests.

- `payment-service`
  Runs on port `8083`. Verifies payments, stores usage logs, and exposes usage and earnings data.

- `common`
  Shared DTOs and common dependencies used by multiple services.

## High-Level Flow

1. The frontend talks only to the API gateway at `http://localhost:8080`.
2. Login starts in `auth-service` through GitHub OAuth.
3. Providers create API listings and endpoints through `provider-service`.
4. Consumers browse listings through `provider-service` marketplace endpoints.
5. Paid requests are verified by `payment-service`.
6. Usage and earnings are read back through `payment-service`.

## Ports

- Gateway: `8080`
- Auth service: `8081`
- Provider service: `8082`
- Payment service: `8083`
- MySQL: `3306`
- Redis: `6379`
- RabbitMQ: `5672`

## Environment Variables

These are referenced directly from the current project config:

- `JWT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `INTERNAL_API_KEY`
- `INTERNAL_KEY`
- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASS`

## Local Infrastructure

The current config expects:

- MySQL running locally with a database named `x402_auth`
- Redis running locally on `6379`
- RabbitMQ running locally on `5672`

Notes:

- `auth-service`, `provider-service`, and `payment-service` currently point at the same MySQL database.
- The gateway and payment service both rely on Redis and RabbitMQ.

## Important Config Defaults

- Frontend callback URL in `auth-service`:
  `app.frontend-url=http://localhost:5173`

- Frontend API base in the React app:
  `http://localhost:8080`

- Blockchain RPC:
  Base Sepolia via `https://sepolia.base.org`

- USDC contract:
  `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## Main API Areas

### Auth Service

Base path: `/api/auth`

- `GET /me`
- `POST /refresh`
- `PATCH /role`
- `PATCH /wallet`
- `POST /exchange`
- `GET /wallet/lookup`
- `GET /validate-key`
- `GET /health`

API key management:

- `POST /api/auth/keys`
- `GET /api/auth/keys`
- `DELETE /api/auth/keys/{keyId}`

### Provider Service

Protected provider routes:

- `POST /api/provider/apis`
- `GET /api/provider/apis/mine`
- `GET /api/provider/apis/{id}`
- `PUT /api/provider/apis/{id}`
- `PATCH /api/provider/apis/{id}/status`
- `POST /api/provider/apis/{apiId}/endpoints`
- `PUT /api/provider/endpoints/{id}`
- `DELETE /api/provider/endpoints/{id}`

Marketplace routes:

- `GET /api/marketplace`
- `GET /api/marketplace/{id}`
- `GET /api/marketplace/lookup`
- `GET /api/marketplace/health`

### Payment Service

Base path: `/api/pay`

- `POST /verify`
- `GET /usage/me`
- `GET /earnings/me`
- `GET /usage/api/{apiId}`
- `GET /health`

## Running the Backend

From the repo root:

```powershell
mvn clean install
```

Then start the services in separate terminals:

```powershell
mvn -pl auth-service spring-boot:run
mvn -pl provider-service spring-boot:run
mvn -pl payment-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

Suggested startup order:

1. MySQL
2. Redis
3. RabbitMQ
4. `auth-service`
5. `provider-service`
6. `payment-service`
7. `api-gateway`

## Health Checks

- Gateway: [http://localhost:8080/health](http://localhost:8080/health)
- Auth: [http://localhost:8081/api/auth/health](http://localhost:8081/api/auth/health)
- Provider: [http://localhost:8082/api/marketplace/health](http://localhost:8082/api/marketplace/health)
- Payment: [http://localhost:8083/api/pay/health](http://localhost:8083/api/pay/health)

## Repo Notes

- The backend is a Maven multi-module build.
- `target/` folders contain generated artifacts and should not be treated as source.
- This README intentionally documents the current implementation and config, not an idealized architecture.
