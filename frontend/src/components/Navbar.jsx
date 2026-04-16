import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navbar.css';
export default function Navbar() {
    const { user, login, logout } = useAuth();
    return (
        <nav className='navbar'>
            <Link to='/' className='nav-logo'>X--402</Link>
            <ul className='nav-links'>
                <li><Link to='/'>Marketplace</Link></li>
                <li><Link to='/sell'>Sell</Link></li>
                {user && <li><Link to='/my-apis'>My APIs</Link></li>}
                {user && <li><Link to='/usage'>Usage</Link></li>}
                {user && <li><Link to='/earnings'>Earnings</Link></li>}
            </ul>
            <div className='nav-right'>
                <span className='nav-badge'>Base Sepolia</span>
                {user ? (
                    <div className='nav-user'>
                        <img src={user.avatarUrl} alt='' className='nav-avatar' />
                        <span>{user.name}</span>
                        <button className='btn-ghost' onClick={logout}>Logout</button>
                    </div>
                ) : (
                    <button className='btn-connect' onClick={login}>
                        Connect with GitHub
                    </button>
                )}
            </div>
        </nav>
    );
}
