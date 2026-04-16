import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getApiDetail } from '../services/api';
import '../styles/marketplace.css';

export default function ApiDetail() {
  const { id } = useParams();
  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApi();
  }, [id]);

  const loadApi = async () => {
    const data = await getApiDetail(id);
    if (data.data) setApi(data.data);
    setLoading(false);
  };

  if (loading) return <div style={{padding: '80px 40px', color: 'var(--fg2)'}}>Loading...</div>;
  if (!api) return <div style={{padding: '80px 40px', color: 'var(--red)'}}>API not found</div>;

  return (
    <div className="api-detail">
      <div className="api-detail-header">
        <div>
          <div className="card-category">{api.category || 'API'}</div>
          <h1 className="api-detail-title">{api.name}</h1>
          <p className="api-detail-desc">{api.description}</p>
        </div>
        <div className="api-detail-meta">
          <div className="stat-cell">
            <div className="stat-num">{api.endpoints?.length || 0}</div>
            <div className="stat-label">Endpoints</div>
          </div>
          <div className="stat-cell">
            <div className="stat-num">Base</div>
            <div className="stat-label">Network</div>
          </div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Endpoints</span>
      </div>

      <div className="endpoints-list">
        {api.endpoints?.map(ep => (
          <div key={ep.id} className="endpoint-card">
            <div className="endpoint-top">
              <span className="endpoint-method">{ep.method}</span>
              <span className="endpoint-path">{ep.path}</span>
            </div>
            <p className="endpoint-desc">{ep.description}</p>
            <div className="endpoint-bottom">
              <div className="card-price">{ep.pricePerCall} USDC</div>
              <div className="card-price-label">per call</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}