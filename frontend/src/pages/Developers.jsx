import { useState } from 'react';
import '../styles/marketplace.css';

const snippets = {
  javascript: `const { X402Client } = require('@x402/sdk');

const client = new X402Client({
  apiKey: process.env.X402_API_KEY,
  baseUrl: 'http://localhost:8080',
  privateKey: process.env.WALLET_PRIVATE_KEY,
  rpcUrl: 'https://sepolia.base.org',
});

const response = await client.get(1, '/api/breeds/image/random');
console.log(response);`,
  java: `x402Client client = new x402Client.Builder()
    .apiKey(System.getenv("X402_API_KEY"))
    .privateKey(System.getenv("WALLET_PRIVATE_KEY"))
    .gatewayUrl("http://localhost:8080")
    .rpcUrl("https://sepolia.base.org")
    .build();

client.call("1", "/api/breeds/image/random", "GET", "")
    .thenAccept(System.out::println)
    .join();`,
  curl: `curl -H "X-API-Key: x402_sk_..." \\
  -H "X-402-Payment: 0x..." \\
  http://localhost:8080/api/call/1/api/breeds/image/random`,
};

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
      <div className="page-header">
        <div>
          <div className="section-eyebrow">Developer docs</div>
          <h1 className="api-detail-title">Build with X402 SDKs</h1>
          <p className="api-detail-desc">
            Use API keys, Base Sepolia USDC payments, and automatic 402 retry flows from JavaScript or Java clients.
          </p>
        </div>
        <div className="api-detail-meta">
          <div className="stat-cell">
            <div className="stat-num">JS</div>
            <div className="stat-label">Node SDK</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">Java</div>
            <div className="stat-label">JVM SDK</div>
          </div>
        </div>
      </div>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <a href="#quickstart">Quickstart</a>
          <a href="#auth">API keys</a>
          <a href="#payments">Payments</a>
          <a href="#manual">Manual calls</a>
        </aside>

        <main className="docs-main">
          <section id="quickstart" className="docs-section">
            <div>
              <div className="section-title">Quickstart</div>
              <h2>Call paid APIs with one client</h2>
            </div>
            <p>
              Create an API key from the API Keys page, fund your wallet with Base Sepolia USDC, then call any listed endpoint by id and path.
            </p>

            <div className="snippet-tabs" role="tablist" aria-label="SDK examples">
              <button className={active === 'javascript' ? 'active' : ''} onClick={() => setActive('javascript')}>JavaScript</button>
              <button className={active === 'java' ? 'active' : ''} onClick={() => setActive('java')}>Java</button>
              <button className={active === 'curl' ? 'active' : ''} onClick={() => setActive('curl')}>cURL</button>
            </div>

            <div className="snippet-box">
              <div className="response-top">
                <span>{active}</span>
                <button className="btn-small-ghost" onClick={copySnippet}>{copied ? 'Copied' : 'Copy'}</button>
              </div>
              <pre className="response-pre">{snippets[active]}</pre>
            </div>
          </section>

          <section id="auth" className="docs-section">
            <div>
              <div className="section-title">API keys</div>
              <h2>Pass your key with every call</h2>
            </div>
            <p>
              SDKs send `X-API-Key` to the gateway. Store keys in environment variables and copy the one-time key when it is generated.
            </p>
          </section>

          <section id="payments" className="docs-section">
            <div>
              <div className="section-title">Payments</div>
              <h2>Handle 402 automatically</h2>
            </div>
            <p>
              When the gateway returns payment requirements, SDKs pay the provider wallet in USDC on Base Sepolia, attach `X-402-Payment`, and retry the call.
            </p>
          </section>

          <section id="manual" className="docs-section">
            <div>
              <div className="section-title">Manual calls</div>
              <h2>Bring your own transaction hash</h2>
            </div>
            <p>
              Clients without a private key can pay manually and send the transaction hash in `X-402-Payment` on the second request.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
