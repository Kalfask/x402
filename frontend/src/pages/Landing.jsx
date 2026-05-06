import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, Search, SlidersHorizontal } from 'lucide-react';
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
    return apis.filter((api) => {
      const haystack = `${api.name || ''} ${api.description || ''} ${api.category || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [apis, search]);

  const endpointCount = apis.reduce((total, api) => total + (api.endpoints?.length || 0), 0);
  const freeCount = apis.filter((api) =>
    (api.endpoints || []).some((ep) => Number(ep.pricePerCall) === 0)
  ).length;

  return (
    <main className="marketplace-page">
      <section className="hero hero-cinematic">
        <div className="hero-media-frame" aria-hidden="true">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src="/media/marketplace-background.mp4" type="video/mp4" />
          </video>
          <div className="hero-video-overlay" />
          <div className="hero-watermark-mask" />
          <div className="hero-noise" />
        </div>

        <div className="hero-copy hero-copy-on-media">
          <p className="hero-kicker">X402 Marketplace</p>
          <h1 className="hero-title hero-title-cinematic">
            Paid APIs,
            <br />
            free endpoints,
            <br />
            one marketplace.
          </h1>
          <p className="hero-sub hero-sub-on-media">
            Discover APIs that settle over HTTP 402, test free calls when available,
            and ship against a marketplace that feels built for developers instead of procurement.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn-primary">Browse APIs</Link>
            <Link to="/developers" className="btn-ghost">Read developer docs</Link>
          </div>
        </div>

        <aside className="hero-panel hero-panel-floating" aria-label="Marketplace status">
          <div className="terminal-line">
            <span className="terminal-dot" />
            <span>request_mode: paid_or_free</span>
          </div>
          <div className="terminal-command">
            <span className="terminal-prompt">$</span> x402 call weather/current --mode auto
          </div>
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
              <span>{freeCount}</span>
              <p>With free calls</p>
            </div>
            <div>
              <span>Base</span>
              <p>Settlement rail</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="market-strip market-strip-split" aria-label="Marketplace filters">
        <div>
          <p className="section-eyebrow">Marketplace</p>
          <h2>Browse production APIs, playground endpoints, and wallet-native call flows.</h2>
        </div>

        <div className="market-strip-actions">
          <div className="search-box">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search APIs, categories, use cases"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="market-pills">
            <span>Free playgrounds</span>
            <span>402 payment flow</span>
            <span>SDK-ready</span>
          </div>
        </div>
      </section>

      <div className="filters">
        <span className="filter-label"><SlidersHorizontal size={14} /> Filters</span>
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

      <section className="listings" aria-label="Available API listings">
        {loading ? (
          <div className="empty-card">Loading marketplace...</div>
        ) : filteredApis.length > 0 ? (
          filteredApis.map((api) => (
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

      <section className="editorial-section editorial-section-expanded">
        <div>
          <p className="section-eyebrow">How it works</p>
          <h2>A cleaner split between discovery, testing, and paid execution.</h2>
        </div>
        <div className="process-list">
          <article>
            <span>01</span>
            <h3>List endpoints with intent</h3>
            <p>Providers can expose premium endpoints, lightweight free calls, and a pricing surface that reads clearly in one grid.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Call free or paid</h3>
            <p>Consumers can hit zero-cost endpoints directly or let HTTP 402 handle payment and retry when a call is monetized.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Move into code quickly</h3>
            <p>The developer page and SDK examples make it easy to go from marketplace discovery to a real client integration.</p>
          </article>
        </div>
      </section>

      <section className="developer-bridge">
        <div className="developer-bridge-card">
          <div>
            <p className="section-eyebrow">Developers</p>
            <h3>Need code instead of screenshots?</h3>
            <p>
              The docs page now mirrors your actual SDK structure and shows how free calls,
              paid calls, API keys, and retry flows fit together.
            </p>
          </div>
          <div className="developer-bridge-actions">
            <Link to="/developers" className="btn-primary">
              Open developer page <ChevronRight size={14} />
            </Link>
            <Link to="/sell" className="btn-ghost">
              Publish your own API <Play size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
