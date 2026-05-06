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
  const [copiedResponse, setCopiedResponse] = useState(false);

  useEffect(() => {
    loadApi();
  }, [id]);

  const loadApi = async () => {
    const data = await getApiDetail(id);
    if (data.data) setApi(data.data);
    setPageLoading(false);
  };

  const formatResponse = (response) => JSON.stringify(response, null, 2);

  const copyResponse = async () => {
    if (!apiResponse) return;
    await navigator.clipboard.writeText(formatResponse(apiResponse));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 1600);
  };

  const handleAutoPay = async (ep) => {
    setApiResponse(null);
    setActiveEndpoint(ep);
    const body = ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH'
      ? requestBody || null
      : null;
    const result = await callApi(ep.id, ep.path, body);
    if (result?.success) {
      setApiResponse(result.data);
    }
  };

  const handleManualPay = async () => {
    if (!txHash.trim() || !activeEndpoint) return;
    const result = await callApiWithPayment(activeEndpoint.id, activeEndpoint.path, txHash);
    if (result) {
      setApiResponse(result);
      setShowManual(false);
      setTxHash('');
    }
  };

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
        {api.endpoints?.map((ep) => {
          const isFree = Number(ep.pricePerCall) === 0;
          const freeCallsPerDay = Number(ep.freeCallsPerDay || 0);
          const needsBody = ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH';

          return (
            <div key={ep.id} className="endpoint-card">
              <div className="endpoint-top">
                <span className="endpoint-method">{ep.method}</span>
                <span className="endpoint-path">{ep.path}</span>
                {isFree ? <span className="endpoint-badge free">Free call</span> : null}
                {freeCallsPerDay > 0 ? (
                  <span className="endpoint-badge quota">{freeCallsPerDay} free/day</span>
                ) : null}
              </div>
              <p className="endpoint-desc">{ep.description}</p>

              {needsBody ? (
                <div className="endpoint-body-input">
                  <label className="field-label">Request body (JSON)</label>
                  <textarea
                    placeholder='{"prompt": "Hello world"}'
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12, minHeight: 80 }}
                  />
                </div>
              ) : null}

              <div className="endpoint-bottom">
                <div>
                  <div className={`card-price ${isFree ? 'is-free' : ''}`}>{isFree ? 'Free' : `${ep.pricePerCall} USDC`}</div>
                  <div className="card-price-label">{isFree ? 'no payment required' : 'per call'}</div>
                </div>

                {accessToken ? (
                  <div className="endpoint-actions">
                    {isFree ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleAutoPay(ep)}
                        disabled={loading}
                      >
                        {loading ? status || 'Calling...' : 'Call free API'}
                      </button>
                    ) : (
                      <>
                        {hasWallet ? (
                          <button
                            className="btn-gold"
                            onClick={() => handleAutoPay(ep)}
                            disabled={loading}
                          >
                            {loading ? status || 'Processing...' : `Pay & Call (${ep.pricePerCall} USDC)`}
                          </button>
                        ) : null}

                        <button
                          className="btn-ghost"
                          onClick={() => {
                            setActiveEndpoint(ep);
                            setShowManual(!showManual);
                          }}
                        >
                          {hasWallet ? 'Manual payment' : `Call API (${ep.pricePerCall} USDC)`}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--fg2)' }}>Login to call this API</span>
                )}
              </div>

              {!isFree && showManual && activeEndpoint?.id === ep.id ? (
                <div className="payment-box">
                  <div className="payment-box-title">Manual Payment</div>
                  <p className="field-hint" style={{ marginBottom: 12 }}>
                    Send {ep.pricePerCall} USDC to the provider wallet, then paste the transaction hash.
                  </p>
                  <input
                    type="text"
                    placeholder="0x... transaction hash"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
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
              ) : null}

              {apiResponse && activeEndpoint?.id === ep.id ? (
                <div className="api-response">
                  <div className="response-top">
                    <div className="payment-box-title">API Response</div>
                    <button className="btn-small-ghost" onClick={copyResponse}>
                      {copiedResponse ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="response-pre">{formatResponse(apiResponse)}</pre>
                </div>
              ) : null}

              {error && activeEndpoint?.id === ep.id ? (
                <div style={{ marginTop: 12, color: 'var(--red)', fontSize: 13 }}>
                  {error}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
