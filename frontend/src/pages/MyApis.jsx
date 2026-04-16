import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyApis } from '../services/api';
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

  if (loading) return <div style={{padding: '80px 40px', color: 'var(--fg2)'}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My APIs</h1>
          <p className="page-sub">Manage your listed APIs and track performance</p>
        </div>
        <Link to="/sell"><button className="btn-primary">+ New listing</button></Link>
      </div>

      {apis.length === 0 ? (
        <div className="empty-state">
          <p>You haven't listed any APIs yet.</p>
          <Link to="/sell"><button className="btn-ghost">Create your first listing →</button></Link>
        </div>
      ) : (
        <div className="api-table">
          <div className="table-header">
            <span>Name</span>
            <span>Category</span>
            <span>Endpoints</span>
            <span>Status</span>
          </div>
          {apis.map(api => (
            <Link to={`/marketplace/${api.id}`} key={api.id} className="table-row">
              <span className="table-name">{api.name}</span>
              <span className="table-cat">{api.category}</span>
              <span className="table-count">{api.endpoints?.length || 0}</span>
              <span className={`table-status ${api.status?.toLowerCase()}`}>{api.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}