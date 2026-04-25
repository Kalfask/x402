import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyEarnings } from '../services/api';
import '../styles/dashboard.css';

export default function Earnings() {
  const { accessToken, refresh } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    const data = await getMyEarnings(accessToken, refresh);
    if (data.data) setEarnings(data.data);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '80px 40px', color: 'var(--fg2)' }}>Loading...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Earnings</h1>
          <p className="page-sub">Revenue from your API listings.</p>
        </div>
      </div>

      <div className="earnings-grid">
        <div className="stat-cell">
          <div className="stat-num" style={{ color: 'var(--gold)' }}>
            {earnings?.totalEarnings || '0'} USDC
          </div>
          <div className="stat-label">Total earnings</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num">{earnings?.totalCalls || 0}</div>
          <div className="stat-label">Total calls</div>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Recent transactions</span>
      </div>

      {earnings?.recentTransactions?.length > 0 ? (
        <div className="api-table">
          <div className="table-header five-col">
            <span>Consumer</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Tx Hash</span>
            <span>Date</span>
          </div>
          {earnings.recentTransactions.map((tx) => (
            <div key={tx.id} className="table-row five-col">
              <span className="table-name">
                <span className="table-name-main">User #{tx.consumerId}</span>
                <small className="table-name-sub">Paid call completed</small>
              </span>
              <span style={{ color: 'var(--gold)' }}>{tx.price} USDC</span>
              <span className={`table-status ${tx.status?.toLowerCase()}`}>{tx.status}</span>
              <span className="table-hash">
                {tx.txHash ? `${tx.txHash.slice(0, 10)}...${tx.txHash.slice(-6)}` : '-'}
              </span>
              <span className="table-date">
                {tx.calledAt ? new Date(tx.calledAt).toLocaleDateString() : '-'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No earnings yet. List an API and wait for consumers to call it.</p>
        </div>
      )}
    </div>
  );
}
