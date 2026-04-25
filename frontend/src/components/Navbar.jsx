import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, KeyRound, Menu, Store, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WalletButton from './WalletButton';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const navItems = [
    { to: '/', label: 'Marketplace', icon: Store, protected: false },
    { to: '/sell', label: 'Sell', icon: Wallet, protected: false },
    { to: '/my-apis', label: 'My APIs', icon: LayoutDashboard, protected: true },
    { to: '/api-keys', label: 'API Keys', icon: KeyRound, protected: true },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <span className="nav-logo-mark">x402</span>
          <span className="nav-logo-text">API Commerce</span>
        </Link>

        <button
          className="nav-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className={`nav-panel ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            {navItems
              .filter((item) => !item.protected || user)
              .map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
          </ul>

          <div className="nav-right">
            <span className="nav-badge">Base Sepolia</span>
            <WalletButton />
            {user ? (
              <div className="nav-user">
                <img src={user.avatarUrl} alt="" className="nav-avatar" />
                <div className="nav-user-copy">
                  <span>{user.name}</span>
                  <small>{user.email}</small>
                </div>
                <button className="btn-ghost" onClick={logout}>Logout</button>
              </div>
            ) : (
              <button className="btn-connect" onClick={login}>
                Login with GitHub
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
