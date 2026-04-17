import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiDetail, updateApi, addEndpoint, deleteEndpoint } from '../services/api';
import '../styles/forms.css';

export default function EditApi() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken, refresh } = useAuth();

  const [api, setApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // API fields
  const [form, setForm] = useState({
    name: '', description: '', baseUrl: '', category: '',
  });

  // New endpoint form
  const [showNewEndpoint, setShowNewEndpoint] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    path: '', method: 'POST', description: '', pricePerCall: '',
  });

  useEffect(() => {
    loadApi();
  }, [id]);

  const loadApi = async () => {
    const data = await getApiDetail(id);
    if (data.data) {
      setApi(data.data);
      setForm({
        name: data.data.name || '',
        description: data.data.description || '',
        baseUrl: data.data.baseUrl || '',
        category: data.data.category || '',
      });
    }
    setLoading(false);
  };

  const updateField = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updateNewEp = (field, value) =>
    setNewEndpoint(prev => ({ ...prev, [field]: value }));

  // Save API details
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await updateApi(id, form, accessToken, refresh);
      setSuccess('API updated successfully');
      loadApi();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Add new endpoint
  const handleAddEndpoint = async () => {
    if (!newEndpoint.path || !newEndpoint.pricePerCall) return;
    setSaving(true);
    setError(null);
    try {
      await addEndpoint(id, {
        ...newEndpoint,
        pricePerCall: parseFloat(newEndpoint.pricePerCall),
      }, accessToken, refresh);
      setNewEndpoint({ path: '', method: 'POST', description: '', pricePerCall: '' });
      setShowNewEndpoint(false);
      setSuccess('Endpoint added');
      loadApi();
    } catch (err) {
      setError(err.message || 'Failed to add endpoint');
    } finally {
      setSaving(false);
    }
  };

  // Delete endpoint
  const handleDeleteEndpoint = async (endpointId) => {
    if (!confirm('Delete this endpoint?')) return;
    try {
      await deleteEndpoint(endpointId, accessToken, refresh);
      setSuccess('Endpoint deleted');
      loadApi();
    } catch (err) {
      setError(err.message || 'Failed to delete endpoint');
    }
  };

  if (loading) return <div style={{padding: '80px 40px', color: 'var(--fg2)'}}>Loading...</div>;
  if (!api) return <div style={{padding: '80px 40px', color: 'var(--red)'}}>API not found</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit: {api.name}</h1>
          <p className="page-sub">Update your API details and manage endpoints</p>
        </div>
        <button className="btn-ghost" onClick={() => navigate('/my-apis')}>← Back to My APIs</button>
      </div>

      {error && (
        <div style={{padding: '12px 40px', color: 'var(--red)', fontSize: 13,
          borderBottom: '0.5px solid var(--border)'}}>{error}</div>
      )}
      {success && (
        <div style={{padding: '12px 40px', color: 'var(--green)', fontSize: 13,
          borderBottom: '0.5px solid var(--border)'}}>{success}</div>
      )}

      {/* API Details Section */}
      <div className="section-header">
        <span className="section-title">API Details</span>
      </div>

      <div className="form-body">
        <div className="field-row">
          <label className="field-label">API name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => updateField('name', e.target.value)}
          />
        </div>
        <div className="field-row">
          <label className="field-label">Description</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
          />
        </div>
        <div className="grid2">
          <div className="field-row">
            <label className="field-label">Base URL</label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={e => updateField('baseUrl', e.target.value)}
            />
          </div>
          <div className="field-row">
            <label className="field-label">Category</label>
            <input
              type="text"
              value={form.category}
              onChange={e => updateField('category', e.target.value)}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {/* Endpoints Section */}
      <div className="section-header">
        <span className="section-title">Endpoints ({api.endpoints?.length || 0})</span>
        <button
          className="btn-ghost"
          style={{fontSize: 11, padding: '6px 16px'}}
          onClick={() => setShowNewEndpoint(!showNewEndpoint)}
        >
          {showNewEndpoint ? 'Cancel' : '+ Add endpoint'}
        </button>
      </div>

      {/* New endpoint form */}
      {showNewEndpoint && (
        <div className="form-body" style={{borderBottom: '0.5px solid var(--border)'}}>
          <div className="grid2">
            <div className="field-row">
              <label className="field-label">Path</label>
              <input
                type="text"
                placeholder="/v1/generate"
                value={newEndpoint.path}
                onChange={e => updateNewEp('path', e.target.value)}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Method</label>
              <select
                value={newEndpoint.method}
                onChange={e => updateNewEp('method', e.target.value)}
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <label className="field-label">Description</label>
            <textarea
              placeholder="What does this endpoint do?"
              value={newEndpoint.description}
              onChange={e => updateNewEp('description', e.target.value)}
            />
          </div>
          <div className="field-row">
            <label className="field-label">Price per call (USDC)</label>
            <input
              type="number"
              placeholder="0.001"
              step="0.0001"
              min="0"
              value={newEndpoint.pricePerCall}
              onChange={e => updateNewEp('pricePerCall', e.target.value)}
            />
          </div>
          <button className="btn-gold" onClick={handleAddEndpoint} disabled={saving}>
            {saving ? 'Adding...' : 'Add endpoint'}
          </button>
        </div>
      )}

      {/* Existing endpoints list */}
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
              <button
                className="btn-small-ghost"
                style={{color: 'var(--red)'}}
                onClick={() => handleDeleteEndpoint(ep.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}