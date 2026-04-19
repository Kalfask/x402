import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { getApiDetail } from '../services/api';
import { useApiCall } from '../hooks/useApiCall';
import { useAuth } from '../context/AuthContext';
import '../styles/marketplace.css';

export default function ApiDetail() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const { isConnected } = useAccount();
  const { callApi, callApiWithPayment, loading, error, status } = useApiCall();
  const [api, setApi] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [apiResponse, setApiResponse] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const [requestBody, setRequestBody] = useState('');

  useEffect(() => {
    loadApi();
  }, [id]);

  const loadApi = async () => {
    const data = await getApiDetail(id);
    if (data.data) setApi(data.data);
    setPageLoading(false);
  };

  // Auto pay: MetaMask pops up automatically
  const handleAutoPay = async (ep) => {
    setApiResponse(null);
    setActiveEndpoint(ep);
    const body = (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH')
      ? requestBody || null : null;
    const result = await callApi(ep.id, ep.path, body);
    if (result?.success) {
      setApiResponse(result.data);
    }
};

  // Manual pay: paste txHash
  const handleManualPay = async () => {
    if (!txHash.trim() || !activeEndpoint) return;
    const result = await callApiWithPayment(activeEndpoint.id, activeEndpoint.path, txHash);
    if (result) {
      setApiResponse(result);
      setShowManual(false);
      setTxHash('');
    }
  };

  // Check if wallet is available (connected or saved in DB)
  const hasWallet = isConnected || user?.walletAddress;

  if (pageLoading) return <div style={{ padding: '80px 40px', color: 'var(--fg2)' }}>Loading...</div>;
  if (!api) return <div style={{ padding: '80px 40px', color: 'var(--red)' }}>API not found</div>;

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
              <div>
                <div className="card-price">{ep.pricePerCall} USDC</div>
                <div className="card-price-label">per call</div>
              </div>
              {ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH' ? (
                <div style={{ marginTop: 16, marginBottom: 12 }}>
                  <label className="field-label">Request body (JSON)</label>
                  <textarea
                    placeholder='{"prompt": "Hello world"}'
                    value={requestBody}
                    onChange={e => setRequestBody(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 80 }}
                  />
                </div>
              ) : null}

              {accessToken && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Auto pay button — only if wallet is available */}
                  {hasWallet && (
                    <button
                      className="btn-gold"
                      onClick={() => handleAutoPay(ep)}
                      disabled={loading}
                    >
                      {loading ? status || 'Processing...' : `Pay & Call (${ep.pricePerCall} USDC)`}
                    </button>
                  )}

                  {/* Manual pay fallback */}
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setActiveEndpoint(ep);
                      setShowManual(!showManual);
                    }}
                  >
                    {hasWallet ? 'Manual' : `Call API (${ep.pricePerCall} USDC)`}
                  </button>
                </div>
              )}

              {!accessToken && (
                <span style={{ fontSize: 12, color: 'var(--fg2)' }}>Login to call this API</span>
              )}
            </div>

            {/* Manual payment box */}
            {showManual && activeEndpoint?.id === ep.id && (
              <div className="payment-box">
                <div className="payment-box-title">Manual Payment</div>
                <p className="field-hint" style={{ marginBottom: 12 }}>
                  Send {ep.pricePerCall} USDC to the provider's wallet via MetaMask, then paste the transaction hash:
                </p>
                <input
                  type="text"
                  placeholder="0x... transaction hash"
                  value={txHash}
                  onChange={e => setTxHash(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <button
                  className="btn-gold"
                  onClick={handleManualPay}
                  disabled={loading || !txHash.trim()}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Verifying...' : 'Submit payment'}
                </button>
              </div>
            )}

            {/* API Response */}
            {apiResponse && activeEndpoint?.id === ep.id && (
              <div className="api-response">
                <div className="payment-box-title">API Response</div>
                <pre className="response-pre">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}

            {error && activeEndpoint?.id === ep.id && (
              <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}