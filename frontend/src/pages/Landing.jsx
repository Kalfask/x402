import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Coins, Layers3, Search, ShieldCheck, WalletCards } from 'lucide-react';
import { getMarketplace } from '../services/api';
import ListingCard from '../components/ListingCard';
import '../styles/marketplace.css';

const CATEGORIES = ['All', 'AI', 'Data', 'Finance', 'Media', 'Software'];

export default function Landing() {
  const [apis, setApis] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadApis();
  }, [activeFilter, query]);

  const loadApis = async () => {
    const category = activeFilter === 'All' ? null : activeFilter;
    const search = query.trim() || null;
    const data = await getMarketplace(search, category);
    if (data.data) setApis(data.data);
  };

  return (
    <div className="page-shell landing-shell">
      <section className="hero hero-minimal">
        <div className="hero-copy">
          <div className="hero-label">x402 marketplace</div>
          <h1 className="hero-title hero-title-tight">
            Paid APIs with a
            <br />
            product-grade buyer flow.
          </h1>
          <p className="hero-sub hero-sub-tight">
            Browse endpoints, pay in USDC, and test responses inside one clear interface.
            For providers, listings, usage, earnings, and keys stay under the same roof.
          </p>

          <div className="hero-actions">
            <Link to="/sell" className="btn-primary btn-link">
              <span>List your API</span>
              <ArrowRight size={15} />
            </Link>
            <Link to="/marketplace" className="btn-ghost btn-link">Browse marketplace</Link>
          </div>

          <div className="hero-highlights">
            <div className="hero-highlight">
              <ShieldCheck size={16} />
              <span>GitHub auth</span>
            </div>
            <div className="hero-highlight">
              <WalletCards size={16} />
              <span>Wallet-linked access</span>
            </div>
            <div className="hero-highlight">
              <Coins size={16} />
              <span>USDC settlement</span>
            </div>
          </div>
        </div>

        <div className="hero-panel hero-panel-quiet">
          <div className="hero-panel-head">
            <span className="panel-kicker">Payment flow</span>
          </div>

          <div className="flow-stack">
            <div className="flow-row">
              <span className="flow-step">01</span>
              <div>
                <strong>Inspect the API</strong>
                <p>Read the listing, see endpoints, pricing, and request shape before you touch checkout.</p>
              </div>
            </div>
            <div className="flow-row">
              <span className="flow-step">02</span>
              <div>
                <strong>Authenticate and pay</strong>
                <p>Use GitHub login, connect a wallet, or fall back to transaction-hash verification.</p>
              </div>
            </div>
            <div className="flow-row">
              <span className="flow-step">03</span>
              <div>
                <strong>Call and monitor</strong>
                <p>Test the response, then move into API keys, usage history, and provider-side earnings.</p>
              </div>
            </div>
          </div>

          <div className="stat-grid stat-grid-quiet">
            <div className="stat-cell">
              <div className="stat-num">{apis.length}</div>
              <div className="stat-label">Live listings</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">&lt;2s</div>
              <div className="stat-label">Settlement target</div>
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-strip">
        <article className="workspace-card">
          <span className="section-title">For buyers</span>
          <h3>Find a paid endpoint and test it without leaving the product.</h3>
          <p>Marketplace browsing, request setup, payment, and response inspection stay connected.</p>
        </article>
        <article className="workspace-card">
          <span className="section-title">For providers</span>
          <h3>Publish once, then manage the business side from the same interface.</h3>
          <p>Listings, statuses, usage, earnings, wallet links, and API keys stay close to the product itself.</p>
        </article>
      </section>

      <section className="section-header section-header-rich">
        <div>
          <span className="section-title">Marketplace</span>
          <h2 className="section-heading">Available APIs</h2>
        </div>
        <div className="section-meta">
          <Layers3 size={16} />
          <span>{apis.length} listings</span>
        </div>
      </section>

      <section className="filters-toolbar">
        <label className="search-shell">
          <Search size={16} />
          <input
            className="search-input"
            type="text"
            placeholder="Search APIs or categories"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="listings">
        {apis.length > 0 ? (
          apis.map((api) => (
            <Link to={`/marketplace/${api.id}`} key={api.id} className="listing-link">
              <ListingCard api={api} />
            </Link>
          ))
        ) : (
          <div className="empty-panel">
            <p>No APIs match this filter yet.</p>
            <Link to="/sell" className="btn-primary btn-link">
              <span>Create the first listing</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
