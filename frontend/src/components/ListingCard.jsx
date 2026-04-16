export default function ListingCard({ api }) {
    // Find the lowest price endpoint for display
    const minPrice = api.endpoints?.reduce((min, ep) =>
        ep.pricePerCall < min ? ep.pricePerCall : min,
        api.endpoints[0]?.pricePerCall || 0
    );
    return (
        <div className='listing-card'>
            <div className='card-arrow'>--'</div>
            <div className='card-category'>{api.category || 'API'}</div>
            <div className='card-tag'>Per-call</div>
            <div className='card-title'>{api.name}</div>
            <div className='card-desc'>{api.description}</div>
            <div className='card-footer'>
                <div>
                    <div className='card-price'>{minPrice} USDC</div>
                    <div className='card-price-label'>per call</div>
                </div>
                <div className='card-chain'>
                    <span className='chain-dot'></span>Base
                </div>
            </div>
        </div>
    );
}
