import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyUsage } from '../services/api';
import '../styles/dashboard.css';

export default function Usage() {
  const { accessToken, refresh } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    const data = await getMyUsage(accessToken, refresh);
    if (data.data) setLogs(data.data);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '80px 40px', color: 'var(--fg2)' }}>Loading...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usage History</h1>
          <p className="page-sub">Your API call history and payment activity.</p>
        </div>
      </div>

      <div className="summary-strip">
        <div className="summary-card">
          <span className="summary-label">Total calls</span>
          <strong>{logs.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Successful</span>
          <strong>{logs.filter((log) => log.status === 'CONFIRMED').length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Spent</span>
          <strong>{logs.reduce((sum, log) => sum + Number(log.price || 0), 0)} USDC</strong>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>No API calls yet. Browse the marketplace to get started.</p>
        </div>
      ) : (
        <div className="api-table">
          <div className="table-header five-col">
            <span>Endpoint</span>
            <span>Price</span>
            <span>Status</span>
            <span>Tx Hash</span>
            <span>Date</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="table-row five-col">
              <span className="table-name">
                <span className="table-name-main">Endpoint #{log.endpointId}</span>
                <small className="table-name-sub">{log.txHash ? 'Paid onchain request' : 'Awaiting payment trace'}</small>
              </span>
              <span style={{ color: 'var(--gold)' }}>{log.price} USDC</span>
              <span className={`table-status ${log.status?.toLowerCase()}`}>{log.status}</span>
              <span className="table-hash">
                {log.txHash ? `${log.txHash.slice(0, 10)}...${log.txHash.slice(-6)}` : '-'}
              </span>
              <span className="table-date">
                {log.calledAt ? new Date(log.calledAt).toLocaleDateString() : '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
