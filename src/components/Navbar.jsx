// src/components/Navbar.jsx
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">RAF Event Booker</Link>
            </div>

            {/* ======== OVA FORMA JE NEDOSTAJALA ======== */}
            <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                <input
                    type="text"
                    placeholder="Pretraži događaje po naslovu ili opisu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.5rem', marginRight: '0.5rem', minWidth: '300px', fontSize: '1rem' }}
                />
                <button type="submit" style={{ padding: '0.5rem 1rem' }}>Traži</button>
            </form>
            {/* ======================================== */}

            <div className="nav-actions">
                {user ? (
                    <>
                        <span>Zdravo, {user.email} ({user.role})</span>
                        <Link to="/categories">Kategorije</Link>
                        <Link to="/events-management">Događaji</Link>
                        {user.role === 'ADMIN' && <Link to="/users">Korisnici</Link>}
                        <button onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </div>
        </nav>
    );
}

export default Navbar;