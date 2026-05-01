import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getMarketplace } from '../services/api';
import ListingCard from '../components/ListingCard';
import '../styles/marketplace.css';

const CATEGORIES = ['All', 'AI', 'Data', 'Finance', 'Media', 'Software'];

export default function Landing() {
  const [apis, setApis] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadApis = useCallback(async () => {
    setLoading(true);
    const category = activeFilter === 'All' ? null : activeFilter;
    const data = await getMarketplace(null, category);
    if (data.data) setApis(data.data);
    setLoading(false);
  }, [activeFilter]);

  useEffect(() => {
    loadApis();
  }, [loadApis]);

  const filteredApis = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return apis;
    return apis.filter(api => {
      const haystack = `${api.name || ''} ${api.description || ''} ${api.category || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [apis, search]);

  const endpointCount = apis.reduce((total, api) => total + (api.endpoints?.length || 0), 0);

  return (
    <main className="marketplace-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">X402 Marketplace</p>
          <h1 className="hero-title">
            APIs you can pay for at the moment of use.
          </h1>
          <p className="hero-sub">
            A crisp marketplace for discoverable, wallet-native APIs. Publish an endpoint,
            set a per-call USDC price, and let HTTP 402 handle the transaction.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn-primary">Browse marketplace</Link>
            <Link to="/sell" className="btn-ghost">List an API</Link>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Marketplace status">
          <div className="terminal-line">
            <span className="terminal-dot" />
            <span>payment_required: true</span>
          </div>
          <div className="terminal-command">curl /api/weather --pay 0.002 USDC</div>
          <div className="terminal-grid">
            <div>
              <span>{apis.length}</span>
              <p>Live APIs</p>
            </div>
            <div>
              <span>{endpointCount}</span>
              <p>Endpoints</p>
            </div>
            <div>
              <span>Base</span>
              <p>Settlement</p>
            </div>
            <div>
              <span>402</span>
              <p>HTTP native</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="market-strip" aria-label="Marketplace filters">
        <div>
          <p className="section-eyebrow">Marketplace</p>
          <h2>Find a paid endpoint without the procurement theatre.</h2>
        </div>
        <div className="search-box">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search APIs, categories, use cases"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </section>

      <div className="filters">
        <span className="filter-label"><SlidersHorizontal size={14} /> Filters</span>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${activeFilter === cat ? 'active' : ''}`}
            onClick={() => setActiveFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <section className="listings" aria-label="Available API listings">
        {loading ? (
          <div className="empty-card">Loading marketplace...</div>
        ) : filteredApis.length > 0 ? (
          filteredApis.map(api => (
            <Link to={`/marketplace/${api.id}`} key={api.id} aria-label={`View ${api.name}`}>
              <ListingCard api={api} />
            </Link>
          ))
        ) : (
          <div className="empty-card">
            <p>No APIs match this view.</p>
            <Link to="/sell" className="inline-link">Publish the first one</Link>
          </div>
        )}
      </section>

      <section className="editorial-section">
        <div>
          <p className="section-eyebrow">How it works</p>
          <h2>One interface for sellers, buyers, and settlement.</h2>
        </div>
        <div className="process-list">
          <article>
            <span>01</span>
            <h3>Publish the endpoint</h3>
            <p>Providers add a base URL, endpoint path, method, and a clear per-call price.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Call with payment</h3>
            <p>Consumers connect a wallet or submit a transaction hash before the API call runs.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Track usage</h3>
            <p>Dashboards keep API keys, calls, and provider earnings visible without extra tooling.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
