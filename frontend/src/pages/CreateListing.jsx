import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createApi, addEndpoint, updateApiStatus } from '../services/api';
import '../styles/forms.css';

const CATEGORIES = ['AI', 'Data', 'Finance', 'Media', 'Software', 'Other'];

export default function CreateListing() {
  const { accessToken, refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    baseUrl: '',
    category: 'AI',
    endpointPath: '',
    endpointMethod: 'POST',
    pricePerCall: '',
    endpointDesc: '',
  });

  const update = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const goNext = () => {
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const apiRes = await createApi({
        name: form.name,
        description: form.description,
        baseUrl: form.baseUrl,
        category: form.category,
      }, accessToken, refresh);

      const apiId = apiRes.data.id;

      await addEndpoint(apiId, {
        path: form.endpointPath,
        method: form.endpointMethod,
        description: form.endpointDesc,
        pricePerCall: parseFloat(form.pricePerCall),
      }, accessToken, refresh);

      await updateApiStatus(apiId, 'ACTIVE', accessToken, refresh);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setForm({
      name: '', description: '', baseUrl: '', category: 'AI',
      endpointPath: '', endpointMethod: 'POST', pricePerCall: '', endpointDesc: '',
    });
    setError(null);
  };

  const previewTitle = form.name || 'Your listing title';
  const previewDesc = form.description || 'Your description will appear here.';
  const previewPrice = form.pricePerCall ? `${form.pricePerCall} USDC` : '\u2014';

  return (
    <div className="shell">

      <div className="top-bar">
        <span className="logo">X\u2014402</span>
        <span className="top-label">New listing</span>
        <span className="top-label">Step {Math.min(step, 3)} of 3</span>
      </div>

      <div className="progress-line">
        <div className="progress-fill" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
      </div>

      {step <= 3 && (
        <div className="stepper">
          {[
            { num: 1, title: 'API Details', sub: 'Name, URL & category' },
            { num: 2, title: 'Endpoint', sub: 'Path, method & price' },
            { num: 3, title: 'Review', sub: 'Confirm & publish' },
          ].map(s => (
            <div key={s.num} className={`step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
              <div className="step-num">{step > s.num ? '\u2713' : s.num}</div>
              <div className="step-info"><p>{s.title}</p><span>{s.sub}</span></div>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="form-body">
          <div className="field-row">
            <label className="field-label">API name</label>
            <input type="text" placeholder="e.g. Real-time DeFi price feed" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div className="field-row">
            <label className="field-label">Description</label>
            <textarea placeholder="Describe what your API does, who it's for, and what makes it unique..." value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
          <div className="field-row">
            <label className="field-label">Base URL</label>
            <input type="text" placeholder="https://your-api-server.com/api" value={form.baseUrl} onChange={e => update('baseUrl', e.target.value)} />
            <p className="field-hint">The root URL where your API is hosted</p>
          </div>
          <div className="field-row">
            <label className="field-label">Category</label>
            <div className="type-cards">
              {CATEGORIES.map(cat => (
                <div key={cat} className={`type-card ${form.category === cat ? 'sel' : ''}`} onClick={() => update('category', cat)}>
                  <p>{cat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="form-body">
          <div className="grid2">
            <div className="field-row">
              <label className="field-label">Endpoint path</label>
              <input type="text" placeholder="/v1/generate" value={form.endpointPath} onChange={e => update('endpointPath', e.target.value)} />
              <p className="field-hint">The path after your base URL</p>
            </div>
            <div className="field-row">
              <label className="field-label">HTTP method</label>
              <select value={form.endpointMethod} onChange={e => update('endpointMethod', e.target.value)}>
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <label className="field-label">Endpoint description</label>
            <textarea placeholder="What does this endpoint do? What parameters does it accept?" value={form.endpointDesc} onChange={e => update('endpointDesc', e.target.value)} />
          </div>
          <div className="field-row">
            <label className="field-label">Price per call (USDC)</label>
            <input type="number" placeholder="0.001" step="0.0001" min="0" value={form.pricePerCall} onChange={e => update('pricePerCall', e.target.value)} />
            <p className="field-hint">Consumers pay this amount in USDC on Base Sepolia for each API call</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="form-body">
          <div className="grid2">
            <div>
              <p className="field-label" style={{ marginBottom: 16 }}>Listing preview</p>
              <div className="preview-card">
                <div className="preview-header">
                  <span>{form.category}</span>
                  <span style={{ color: 'var(--gold)', fontSize: 10 }}>Per call</span>
                </div>
                <div className="preview-body">
                  <div className="preview-cat">{form.category}</div>
                  <div className="preview-title">{previewTitle}</div>
                  <div className="preview-desc">{previewDesc}</div>
                  <div className="preview-footer">
                    <div>
                      <div className="preview-price">{previewPrice}</div>
                      <div className="preview-price-sub">per call</div>
                    </div>
                    <div className="preview-chain">
                      <span className="cd" style={{ background: '#2775ca', opacity: 1 }} />
                      Base Sepolia
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="field-label" style={{ marginBottom: 16 }}>Summary</p>
              <table className="summary-table">
                <tbody>
                  <tr><td className="sum-label">API name</td><td className="sum-value">{form.name || '\u2014'}</td></tr>
                  <tr><td className="sum-label">Category</td><td className="sum-value">{form.category}</td></tr>
                  <tr><td className="sum-label">Base URL</td><td className="sum-value">{form.baseUrl || '\u2014'}</td></tr>
                  <tr><td className="sum-label">Endpoint</td><td className="sum-value">{form.endpointMethod} {form.endpointPath || '\u2014'}</td></tr>
                  <tr><td className="sum-label">Price</td><td className="sum-value" style={{ color: 'var(--gold)' }}>{previewPrice}</td></tr>
                  <tr><td className="sum-label">Network</td><td className="sum-value">Base Sepolia</td></tr>
                  <tr><td className="sum-label">Currency</td><td className="sum-value">USDC</td></tr>
                </tbody>
              </table>
              <div className="publish-note">
                <p className="publish-note-title">Publishing</p>
                <p className="publish-note-text">Your API will be listed on the marketplace immediately and start accepting USDC payments on Base Sepolia.</p>
              </div>
            </div>
          </div>
          {error && (
            <div style={{ marginTop: 20, padding: 16, border: '0.5px solid var(--red)', color: 'var(--red)', fontSize: 13 }}>{error}</div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="success-screen">
          <div className="success-icon">\u2713</div>
          <h2 className="success-title">Listing published.</h2>
          <p className="success-sub">Your API is now live on the x402 marketplace and accepting payments.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn-next" onClick={() => window.location.href = '/my-apis'}>View my APIs \u2197</button>
            <button className="btn-back" onClick={resetForm}>Create another listing</button>
          </div>
        </div>
      )}

      {step <= 3 && (
        <div className="form-actions">
          <button className="btn-back" onClick={goBack} style={{ visibility: step > 1 ? 'visible' : 'hidden' }}>\u2190 Back</button>
          <button className={`btn-next ${step === 3 ? 'gold' : ''}`} onClick={goNext} disabled={submitting}>
            {submitting ? 'Publishing...' : step === 3 ? 'Publish listing \u2192' : 'Continue \u2192'}
          </button>
        </div>
      )}

    </div>
  );
}
