import { ArrowUpRight } from 'lucide-react';

export default function ListingCard({ api }) {
  const prices = api.endpoints?.map(ep => Number(ep.pricePerCall)).filter(Number.isFinite) || [];
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const endpointCount = api.endpoints?.length || 0;

  return (
    <article className="listing-card">
      <div className="card-topline">
        <span>{api.category || 'API'}</span>
        <ArrowUpRight size={16} aria-hidden="true" />
      </div>
      <h3 className="card-title">{api.name}</h3>
      <p className="card-desc">{api.description}</p>
      <div className="card-footer">
        <div>
          <div className="card-price">{minPrice} USDC</div>
          <div className="card-price-label">starting price</div>
        </div>
        <div className="card-chain">
          <span className="chain-dot" />
          {endpointCount} {endpointCount === 1 ? 'endpoint' : 'endpoints'}
        </div>
      </div>
    </article>
  );
}
