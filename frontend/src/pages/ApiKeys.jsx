import { useEffect, useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyKeys, createApiKey, deactivateKey } from '../services/api';
import '../styles/dashboard.css';

export default function ApiKeys() {
  const { accessToken, refresh } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const data = await getMyKeys(accessToken, refresh);
    if (data.data) setKeys(data.data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const data = await createApiKey(newKeyName, accessToken, refresh);
    if (data.data) {
      setCreatedKey(data.data.apiKey);
      setNewKeyName('');
      loadKeys();
    }
    setCreating(false);
  };

  const handleDeactivate = async (keyId) => {
    if (!confirm('Deactivate this key? It will stop working immediately.')) return;
    await deactivateKey(keyId, accessToken, refresh);
    loadKeys();
  };

  const copyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
    }
  };

  if (loading) return <div style={{ padding: '80px 40px', color: 'var(--fg2)' }}>Loading...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-sub">Use these keys to call APIs from your code without OAuth login.</p>
        </div>
      </div>

      <div className="form-body form-section">
        <div className="field-row" style={{ marginBottom: 0 }}>
          <label className="field-label">Create new key</label>
          <div className="inline-actions wrap">
            <input
              type="text"
              placeholder="Key name (e.g. Production, Testing)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              style={{ flex: 1 }}
            />
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
            >
              <Plus size={15} />
              <span>{creating ? 'Creating...' : 'Generate key'}</span>
            </button>
          </div>
        </div>

        {createdKey && (
          <div className="success-callout">
            <p className="success-callout-title">
              Key created. Copy it now because it will not be shown again.
            </p>
            <div className="code-block">{createdKey}</div>
            <button className="btn-ghost btn-link compact" onClick={copyKey}>
              <Copy size={14} />
              <span>Copy key</span>
            </button>
          </div>
        )}
      </div>

      <div className="section-header">
        <span className="section-title">Your keys ({keys.length})</span>
      </div>

      {keys.length === 0 ? (
        <div className="empty-state">
          <p>No API keys yet. Create one above to get started.</p>
        </div>
      ) : (
        <div className="api-table">
          <div className="table-header five-col">
            <span>Name</span>
            <span>Key prefix</span>
            <span>Status</span>
            <span>Last used</span>
            <span>Actions</span>
          </div>
          {keys.map((k) => (
            <div key={k.id} className="table-row five-col">
              <span className="table-name">
                <span className="table-name-main">{k.name}</span>
                <small className="table-name-sub">Personal access key</small>
              </span>
              <span className="table-hash">{k.prefix}</span>
              <span className={`table-status ${k.active ? 'active' : 'disabled'}`}>
                {k.active ? 'Active' : 'Inactive'}
              </span>
              <span className="table-date">{k.lastUsedAt || '-'}</span>
              <div>
                {k.active && (
                  <button
                    className="btn-small-ghost"
                    style={{ color: 'var(--red)' }}
                    onClick={() => handleDeactivate(k.id)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="usage-example">
        <p className="field-label">Usage example</p>
        <div className="code-block">
          <div>curl -H "X-Api-Key: x402_sk_..." \</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;-H "X-402-Payment: 0x..." \</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;http://localhost:8080/api/call/5/random_joke</div>
        </div>
      </div>
    </div>
  );
}
