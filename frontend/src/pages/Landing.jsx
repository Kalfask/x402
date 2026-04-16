import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMarketplace } from '../services/api';
import ListingCard from '../components/ListingCard';
import '../styles/marketplace.css';

const CATEGORIES = ['All', 'AI', 'Data', 'Finance', 'Media', 'Software'];

export default function Landing() {
  const [apis, setApis] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    loadApis();
  }, [activeFilter]);

  const loadApis = async () => {
    const category = activeFilter === 'All' ? null : activeFilter;
    const data = await getMarketplace(null, category);
    if (data.data) setApis(data.data);
  };

  return (
    <>
      <div className="hero">
        <div>
          <div className="hero-label">x402 Protocol — Onchain commerce</div>
          <h1 className="hero-title">
            Commerce that<br />doesn't ask<br />for <em>permission.</em>
          </h1>
          <p className="hero-sub">
            A peer-to-peer API marketplace powered by HTTP 402 payments.
            No middlemen. No custodians. Instant settlement in USDC.
          </p>
          <div className="hero-actions">
            <Link to="/sell"><button className="btn-primary">Start selling →</button></Link>
            <Link to="/marketplace"><button className="btn-ghost">Browse APIs</button></Link>
          </div>
        </div>
        <div>
          <div className="stat-grid">
            <div className="stat-cell">
              <div className="stat-num">{apis.length}</div>
              <div className="stat-label">Listed APIs</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">USDC</div>
              <div className="stat-label">Currency</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">&lt;2s</div>
              <div className="stat-label">Settlement</div>
            </div>
            <div className="stat-cell">
              <div className="stat-num">Base</div>
              <div className="stat-label">Network</div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Available APIs</span>
      </div>

      <div className="filters">
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

      <div className="listings">
        {apis.length > 0 ? (
          apis.map(api => (
            <Link to={`/marketplace/${api.id}`} key={api.id}>
              <ListingCard api={api} />
            </Link>
          ))
        ) : (
          <div style={{
            padding: '60px 40px', color: 'var(--fg2)',
            fontSize: 14, gridColumn: '1 / -1', textAlign: 'center'
          }}>
            No APIs listed yet. Be the first to sell!
          </div>
        )}
      </div>
    </>
  );
}