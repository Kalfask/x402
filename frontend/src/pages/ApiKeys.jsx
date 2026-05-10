import { useState, useEffect } from 'react';
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

  if (loading) return <div style={{padding: '80px 40px', color: 'var(--fg2)'}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">API Keys</h1>
          <p className="page-sub">Use these keys to call APIs from your own code without OAuth login</p>
        </div>
      </div>

      <div className="form-body" style={{borderBottom: '0.5px solid var(--border)'}}>
        <div className="field-row" style={{marginBottom: 0}}>
          <label className="field-label">Create new key</label>
          <div style={{display: 'flex', gap: 8}}>
            <input
              type="text"
              placeholder="Key name (e.g. Production, Testing)"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              style={{flex: 1}}
            />
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
            >
              {creating ? 'Creating...' : 'Generate key'}
            </button>
          </div>
        </div>

        {createdKey && (
          <div style={{
            marginTop: 16, padding: 16,
            border: '0.5px solid var(--green)',
            background: 'var(--bg2)', borderRadius: 2
          }}>
            <p style={{fontSize: 11, color: 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8}}>
              Key created — copy it now, it won't be shown again
            </p>
            <div style={{
              fontFamily: 'monospace', fontSize: 13, color: 'var(--fg)',
              padding: 12, background: 'var(--bg)', border: '0.5px solid var(--border)',
              borderRadius: 2, wordBreak: 'break-all', cursor: 'pointer'
            }}
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                alert('Copied to clipboard!');
              }}
            >
              {createdKey}
            </div>
            <p className="field-hint" style={{marginTop: 8}}>Click to copy</p>
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
           
            <span>Actions</span>
          </div>
          {keys.map(k => (
            <div key={k.id} className="table-row five-col">
              <span className="table-name">{k.name}</span>
              <span className="table-hash">{k.prefix}</span>
              <span className={`table-status ${k.active ? 'active' : 'disabled'}`}>
                {k.active ? 'Active' : 'Inactive'}
              </span>
              
              <div>
                {k.active && (
                  <button
                    className="btn-small-ghost"
                    style={{color: 'var(--red)'}}
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

      <div style={{padding: '24px 40px', borderTop: '0.5px solid var(--border)'}}>
        <p className="field-label">Usage example</p>
        <div style={{
          fontFamily: 'monospace', fontSize: 12, color: 'var(--fg)',
          padding: 16, background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 2, lineHeight: 1.8
        }}>
          curl -H "X-Api-Key: x402_sk_..." \<br/>
          &nbsp;&nbsp;&nbsp;&nbsp; -H "X-402-Payment: 0x..." \<br/>
          &nbsp;&nbsp;&nbsp;&nbsp; http://localhost:8080/api/call/5/random_joke
        </div>
      </div>
    </div>
  );
}