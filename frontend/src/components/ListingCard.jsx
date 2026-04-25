import { ArrowUpRight, Layers3, Wallet } from 'lucide-react';

export default function ListingCard({ api }) {
    const minPrice = api.endpoints?.reduce((min, ep) =>
        ep.pricePerCall < min ? ep.pricePerCall : min,
        api.endpoints[0]?.pricePerCall || 0
    );

    const endpointCount = api.endpoints?.length || 0;

    return (
        <div className='listing-card'>
            <div className='card-head'>
                <div className='card-category'>{api.category || 'API'}</div>
                <div className='card-tag'>Per call</div>
            </div>
            <div className='card-title'>{api.name}</div>
            <div className='card-desc'>{api.description}</div>
            <div className='card-metrics'>
                <div className='card-metric'>
                    <Layers3 size={14} />
                    <span>{endpointCount} endpoint{endpointCount === 1 ? '' : 's'}</span>
                </div>
                <div className='card-metric'>
                    <Wallet size={14} />
                    <span>Instant USDC settle</span>
                </div>
            </div>
            <div className='card-footer'>
                <div>
                    <div className='card-price'>{minPrice} USDC</div>
                    <div className='card-price-label'>starts at</div>
                </div>
                <div className='card-chain'>
                    <span className='chain-dot'></span>Base
                </div>
            </div>
            <div className='card-arrow'>
                <span>Open API</span>
                <ArrowUpRight size={15} />
            </div>
        </div>
    );
}
