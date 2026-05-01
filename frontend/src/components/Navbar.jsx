import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WalletButton from './WalletButton';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" aria-label="X402 Marketplace home">
        <span className="logo-mark">402</span>
        <span>X402 Marketplace</span>
      </Link>

      <ul className="nav-links">
        <li><NavLink to="/marketplace">Marketplace</NavLink></li>
        <li><NavLink to="/sell">Sell</NavLink></li>
        {user && <li><NavLink to="/my-apis">My APIs</NavLink></li>}
        {user && <li><NavLink to="/api-keys">API Keys</NavLink></li>}
        {user && <li><NavLink to="/usage">Usage</NavLink></li>}
        {user && <li><NavLink to="/earnings">Earnings</NavLink></li>}
      </ul>

      <div className="nav-right">
        <span className="nav-badge">Base Sepolia</span>
        <WalletButton />
        {user ? (
          <div className="nav-user">
            {user.avatarUrl && <img src={user.avatarUrl} alt="" className="nav-avatar" />}
            <span>{user.name || user.username || 'Account'}</span>
            <button className="btn-ghost nav-action" onClick={logout}>Logout</button>
          </div>
        ) : (
          <button className="btn-connect" onClick={login}>
            GitHub login
          </button>
        )}
      </div>
    </nav>
  );
}
