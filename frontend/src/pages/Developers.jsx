import { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, Package, Wallet } from 'lucide-react';
import '../styles/marketplace.css';

const snippets = {
  javascript: `const { X402Client } = require('@x402/sdk');

const client = new X402Client({
  apiKey: process.env.X402_API_KEY,
  baseUrl: 'http://localhost:8080',
  privateKey: process.env.WALLET_PRIVATE_KEY,
  rpcUrl: 'https://sepolia.base.org',
});

const response = await client.getByName('Get Headers', '/headers');
console.log(response);`,
  java: `x402Client client = new x402Client.Builder()
    .apiKey(System.getenv("X402_API_KEY"))
    .privateKey(System.getenv("WALLET_PRIVATE_KEY"))
    .gatewayUrl("http://localhost:8080")
    .rpcUrl("https://sepolia.base.org")
    .build();

client.callByName("Get Headers", "/headers", "GET", "")
    .thenAccept(System.out::println)
    .join();`,
  manual: `const { X402Client } = require('@x402/sdk');

const client = new X402Client({
  apiKey: process.env.X402_API_KEY,
  baseUrl: 'http://localhost:8080',
});

try {
  await client.get(6, '/breeds/image/random');
} catch (error) {
  console.log(error.message);
  // Payment required but no wallet configured.
}`,
  curl: `curl -H "X-API-Key: x402_sk_..." \\
  http://localhost:8080/api/call/12/free/health

curl -H "X-API-Key: x402_sk_..." \\
  -H "X-402-Payment: 0x..." \\
  http://localhost:8080/api/call/5/random_joke`,
};

const sdkCards = [
  { name: '@x402/sdk', status: 'Live now', note: 'Node client with auto-pay, manual payment fallback, and endpoint discovery.' },
  { name: 'com.x402:x402-java-sdk', status: 'Live in repo', note: 'Java SDK in `javaSDK/` with builder-based setup, `call`, and `callByName` methods.' },
  { name: 'Python SDK', status: 'Planned', note: 'Useful for data apps, agents, and scripts that need direct marketplace execution.' },
  { name: 'Go SDK', status: 'Planned', note: 'A tighter fit for infra services, CLIs, and high-concurrency backend consumers.' },
];

export default function Developers() {
  const [active, setActive] = useState('javascript');
  const [copied, setCopied] = useState(false);

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippets[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="developers-page">
      <div className="page-header developers-header">
        <div>
          <div className="section-eyebrow">Developer docs</div>
          <h1 className="api-detail-title">Ship against the marketplace, not around it.</h1>
          <p className="api-detail-desc">
            Use the marketplace to discover APIs, test free endpoints when they are available,
            and move into paid 402 flows without changing the way your client is structured.
          </p>
        </div>
        <div className="api-detail-meta">
          <div className="stat-cell">
            <div className="stat-num">1</div>
            <div className="stat-label">SDK in repo</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">402</div>
            <div className="stat-label">Retry model</div>
          </div>
        </div>
      </div>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <a href="#quickstart">Quickstart</a>
          <a href="#free">Free calls</a>
          <a href="#paid">Paid calls</a>
          <a href="#roadmap">SDK roadmap</a>
        </aside>

        <main className="docs-main">
          <section id="quickstart" className="docs-section docs-section-feature">
            <div>
              <div className="section-title">Quickstart</div>
              <h2>Start with the SDK that matches your stack.</h2>
            </div>
            <p>
              The JavaScript and Java SDKs both support endpoint discovery by name, direct calls by id,
              wallet-backed auto-pay, and a manual mode that returns payment instructions when your client
              should not hold a signing key.
            </p>

            <div className="snippet-tabs" role="tablist" aria-label="SDK examples">
              <button className={active === 'javascript' ? 'active' : ''} onClick={() => setActive('javascript')}>Node SDK</button>
              <button className={active === 'java' ? 'active' : ''} onClick={() => setActive('java')}>Java SDK</button>
              <button className={active === 'manual' ? 'active' : ''} onClick={() => setActive('manual')}>Manual mode</button>
              <button className={active === 'curl' ? 'active' : ''} onClick={() => setActive('curl')}>HTTP calls</button>
            </div>

            <div className="snippet-box">
              <div className="response-top">
                <span className="snippet-label">{active}</span>
                <button className="btn-small-ghost" onClick={copySnippet}>
                  {copied ? 'Copied' : 'Copy'} <Copy size={14} />
                </button>
              </div>
              <pre className="response-pre">{snippets[active]}</pre>
            </div>
          </section>

          <section id="free" className="docs-section">
            <div>
              <div className="section-title">Free calls</div>
              <h2>Use free endpoints to validate auth and response shape quickly.</h2>
            </div>
            <div className="docs-stack">
              <p>
                Free endpoints are ideal for trying a provider before introducing payment handling. When an endpoint is free,
                a standard request with `X-API-Key` is enough, and the response comes back without any `X-402-Payment` retry step.
              </p>
              <div className="docs-note">
                <CheckCircle2 size={18} />
                <span>Use free calls first to validate payload shape, latency, and API-key auth before moving a client into paid execution.</span>
              </div>
            </div>
          </section>

          <section id="paid" className="docs-section">
            <div>
              <div className="section-title">Paid calls</div>
              <h2>Keep the 402 payment loop predictable.</h2>
            </div>
            <div className="docs-stack">
              <p>
                For paid endpoints, the client makes the first request, reads the 402 payment instructions,
                settles in Base Sepolia USDC, sends `X-402-Payment`, and retries the request. The same flow applies
                whether you integrate through JavaScript, Java, or direct HTTP.
              </p>
              <div className="docs-grid">
                <article className="docs-mini-card">
                  <Wallet size={18} />
                  <h3>Wallet-backed mode</h3>
                  <p>Provide a wallet key and let the SDK pay and retry automatically.</p>
                </article>
                <article className="docs-mini-card">
                  <ArrowUpRight size={18} />
                  <h3>Manual mode</h3>
                  <p>Read the payment instructions and retry later with a transaction hash.</p>
                </article>
              </div>
            </div>
          </section>

          <section id="roadmap" className="docs-section">
            <div>
              <div className="section-title">SDK roadmap</div>
              <h2>Plan integrations across more than one language.</h2>
            </div>
            <div className="docs-stack">
              <div className="docs-note">
                <Package size={18} />
                <span>Current Java package coordinates in the repo: `com.x402:x402-java-sdk:1.0.0`.</span>
              </div>
            </div>
            <div className="sdk-grid">
              {sdkCards.map((card) => (
                <article key={card.name} className="sdk-card">
                  <div className="sdk-card-top">
                    <Package size={18} />
                    <span>{card.status}</span>
                  </div>
                  <h3>{card.name}</h3>
                  <p>{card.note}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
