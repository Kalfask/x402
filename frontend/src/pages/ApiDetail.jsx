import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Coins, FileJson, LockKeyhole, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { getApiDetail } from '../services/api';
import { useApiCall } from '../hooks/useApiCall';
import { useAuth } from '../context/AuthContext';
import '../styles/marketplace.css';

const WRITABLE_METHODS = ['POST', 'PUT', 'PATCH'];

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
  const [requestBodies, setRequestBodies] = useState({});

  useEffect(() => {
    loadApi();
  }, [id]);

  const loadApi = async () => {
    const data = await getApiDetail(id);
    if (data.data) setApi(data.data);
    setPageLoading(false);
  };

  const handleAutoPay = async (ep) => {
    setApiResponse(null);
    setActiveEndpoint(ep);
    setShowManual(false);
    const body = WRITABLE_METHODS.includes(ep.method) ? requestBodies[ep.id] || null : null;
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
    <div className="api-detail page-shell">
      <section className="api-detail-header">
        <div className="api-detail-copy">
          <div className="card-category">{api.category || 'API'}</div>
          <h1 className="api-detail-title">{api.name}</h1>
          <p className="api-detail-desc">{api.description}</p>

          <div className="api-detail-badges">
            <span className="detail-badge">
              <Coins size={14} />
              USDC payments
            </span>
            <span className="detail-badge">
              <Wallet size={14} />
              Wallet ready
            </span>
            <span className="detail-badge">
              <LockKeyhole size={14} />
              Protected access
            </span>
          </div>
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
      </section>

      <section className="section-header section-header-rich">
        <div>
          <span className="section-title">Endpoints</span>
          <h2 className="section-heading">Configure a request, pay, and inspect the response.</h2>
        </div>
        <div className="section-meta">
          <CheckCircle2 size={16} />
          <span>{accessToken ? 'Signed in and ready to test' : 'Login required to call'}</span>
        </div>
      </section>

      <section className="endpoints-list">
        {api.endpoints?.map((ep) => (
          <article key={ep.id} className="endpoint-card">
            <div className="endpoint-top endpoint-top-rich">
              <div className="endpoint-heading">
                <span className="endpoint-method">{ep.method}</span>
                <span className="endpoint-path">{ep.path}</span>
              </div>

              <div className="endpoint-price-block">
                <div className="card-price">{ep.pricePerCall} USDC</div>
                <div className="card-price-label">per call</div>
              </div>
            </div>

            <p className="endpoint-desc">{ep.description}</p>

            <div className="endpoint-body">
              {WRITABLE_METHODS.includes(ep.method) && (
                <div className="endpoint-request">
                  <label className="field-label">Request body (JSON)</label>
                  <textarea
                    placeholder='{"prompt": "Hello world"}'
                    value={requestBodies[ep.id] || ''}
                    onChange={(e) => setRequestBodies((prev) => ({ ...prev, [ep.id]: e.target.value }))}
                    className="request-textarea"
                  />
                </div>
              )}

              <div className="endpoint-actions">
                {accessToken ? (
                  <>
                    <div className="endpoint-action-copy">
                      <span className="detail-badge">
                        <FileJson size={14} />
                        HTTP 402 payment flow
                      </span>
                    </div>

                    <div className="inline-actions wrap">
                      {hasWallet && (
                        <button
                          className="btn-gold"
                          onClick={() => handleAutoPay(ep)}
                          disabled={loading}
                        >
                          {loading && activeEndpoint?.id === ep.id
                            ? status || 'Processing...'
                            : `Pay & Call ${ep.pricePerCall} USDC`}
                        </button>
                      )}

                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setActiveEndpoint(ep);
                          setShowManual(activeEndpoint?.id === ep.id ? !showManual : true);
                        }}
                      >
                        {hasWallet ? 'Manual payment' : 'Call with tx hash'}
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="login-hint">Login to call this API</span>
                )}
              </div>
            </div>

            {showManual && activeEndpoint?.id === ep.id && (
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
            )}

            {apiResponse && activeEndpoint?.id === ep.id && (
              <div className="api-response">
                <div className="payment-box-title">API Response</div>
                <pre className="response-pre">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </div>
            )}

            {error && activeEndpoint?.id === ep.id && (
              <div className="inline-error">{error}</div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
