import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PauseCircle, PencilLine, PlayCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyApis, updateApiStatus } from '../services/api';
import '../styles/dashboard.css';

export default function MyApis() {
  const { accessToken, refresh } = useAuth();
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyApis();
  }, []);

  const loadMyApis = async () => {
    const data = await getMyApis(accessToken, refresh);
    if (data.data) setApis(data.data);
    setLoading(false);
  };

  const toggleStatus = async (api) => {
    const newStatus = api.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await updateApiStatus(api.id, newStatus, accessToken, refresh);
    loadMyApis();
  };

  if (loading) return <div style={{ padding: '80px 40px', color: 'var(--fg2)' }}>Loading...</div>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">My APIs</h1>
          <p className="page-sub">Manage your listed APIs and track performance.</p>
        </div>
        <Link to="/sell" className="btn-primary btn-link">
          <Plus size={15} />
          <span>New listing</span>
        </Link>
      </div>

      <div className="summary-strip">
        <div className="summary-card">
          <span className="summary-label">Total listings</span>
          <strong>{apis.length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Active</span>
          <strong>{apis.filter((api) => api.status === 'ACTIVE').length}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Endpoints</span>
          <strong>{apis.reduce((total, api) => total + (api.endpoints?.length || 0), 0)}</strong>
        </div>
      </div>

      {apis.length === 0 ? (
        <div className="empty-state">
          <p>You have not listed any APIs yet.</p>
          <Link to="/sell" className="btn-ghost btn-link">Create your first listing</Link>
        </div>
      ) : (
        <div className="api-table">
          <div className="table-header five-col">
            <span>Name</span>
            <span>Category</span>
            <span>Endpoints</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {apis.map((api) => (
            <div key={api.id} className="table-row five-col">
              <span className="table-name">
                <span className="table-name-main">{api.name}</span>
                <small className="table-name-sub">{api.description}</small>
              </span>
              <span className="table-cat">{api.category}</span>
              <span className="table-count">{api.endpoints?.length || 0}</span>
              <span className={`table-status ${api.status?.toLowerCase()}`}>{api.status}</span>
              <div className="inline-actions wrap">
                <Link to={`/my-apis/${api.id}/edit`}>
                  <button className="btn-small">
                    <PencilLine size={14} />
                    <span>Edit</span>
                  </button>
                </Link>
                <button className="btn-small-ghost" onClick={() => toggleStatus(api)}>
                  {api.status === 'ACTIVE' ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                  <span>{api.status === 'ACTIVE' ? 'Pause' : 'Activate'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
