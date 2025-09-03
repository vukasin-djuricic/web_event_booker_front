// src/components/Navbar.jsx

import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAllCategories, getAllTags } from '../services/api';
import Modal from './Modal';
import './Navbar.css';

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setFilterModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Pozivamo API sa velikim limitom da dobijemo sve kategorije za filter
                const [catRes, tagRes] = await Promise.all([
                    getAllCategories(1, 200), // Dovoljno veliki limit
                    getAllTags()
                ]);

                // ===== ISPRAVKA =====
                if (catRes.data && catRes.data.data) {
                    setCategories(catRes.data.data);
                }

                if (tagRes.data) { // Tagovi nisu paginirani, pa proveravamo samo data
                    setTags(tagRes.data);
                }
            } catch (error) {
                console.error("Greška pri učitavanju filtera za navigaciju:", error);
            }
        };
        fetchFilters();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            const searchPath = user ? '/ems/search' : '/search';
            navigate(`${searchPath}?query=${searchQuery.trim()}`);
            setSearchQuery('');
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand">
                    <Link to="/">RAF Event Booker</Link>
                    <Link to="/most-visited" style={{ marginLeft: '2rem', fontSize: '1rem' }}>Najposećeniji</Link>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexGrow: 1, justifyContent: 'center' }}>
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Pretraži događaje..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '0.5rem', minWidth: '300px' }}
                        />
                        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Traži</button>
                    </form>
                    <button onClick={() => setFilterModalOpen(true)} style={{ padding: '0.5rem 1rem' }}>
                        Filteri
                    </button>
                </div>

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

            <Modal isOpen={isFilterModalOpen} onClose={() => setFilterModalOpen(false)} title="Filteri">
                <h4>Kategorije</h4>
                <ul className="filter-list">
                    {/* ===== ISPRAVKA ===== */}
                    {categories.map(cat => (
                        <li key={`cat-${cat.id}`}>
                            <Link to={`/category/${cat.id}`} onClick={() => setFilterModalOpen(false)}>
                                {cat.name}
                            </Link>
                        </li>
                    ))}
                </ul>
                <hr style={{margin: '1.5rem 0'}} />
                <h4>Tagovi</h4>
                <ul className="filter-list">
                    {tags.map(tag => (
                        <li key={`tag-${tag.id}`}>
                            <Link to={`/tag/${tag.id}`} onClick={() => setFilterModalOpen(false)}>
                                {tag.naziv}
                            </Link>
                        </li>
                    ))}
                </ul>
            </Modal>
        </>
    );
}

export default Navbar;