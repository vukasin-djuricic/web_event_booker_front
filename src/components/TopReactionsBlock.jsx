// src/components/TopReactionsBlock.jsx

import { useState, useEffect } from 'react'; // 1. Uvezite useState
import { Link } from 'react-router-dom';
import { getTopReactedEvents } from '../services/api';

const blockStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '300px',
    backgroundColor: 'var(--card-background)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    boxShadow: '0 4px 10px var(--shadow-color)',
    padding: '1rem',
    zIndex: 100,
    transition: 'height 0.3s ease-in-out' // Lepša tranzicija
};

// ===== NOVI STILOVI ZA ZAGLAVLJE I DUGME =====
const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
};

const minimizeBtnStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '0 0.5rem',
    lineHeight: '1'
};
// ===============================================

const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
};

const listItemStyle = {
    borderBottom: '1px solid var(--border-color)',
    padding: '0.75rem 0'
};

const lastListItemStyle = {
    ...listItemStyle,
    borderBottom: 'none',
    paddingBottom: 0
};

function TopReactionsBlock() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // 2. Dodajte state za praćenje da li je blok minimiziran
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        const fetchTopEvents = async () => {
            try {
                const response = await getTopReactedEvents();
                setEvents(response.data);
            } catch (error) {
                console.error("Greška pri dohvatanju događaja sa najviše reakcija:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopEvents();
    }, []);

    // 3. Funkcija koja menja stanje minimizacije
    const toggleMinimize = () => {
        setIsMinimized(prev => !prev);
    };

    if (loading || events.length === 0) {
        return null;
    }

    return (
        <div style={blockStyle}>
            {/* 4. Ažurirano zaglavlje sa dugmetom */}
            <div style={headerStyle}>
                <h4 style={{ marginTop: 0, marginBottom: 0 }}>Najviše reakcija</h4>
                <button onClick={toggleMinimize} style={minimizeBtnStyle} title={isMinimized ? 'Proširi' : 'Skupi'}>
                    {isMinimized ? '+' : '−'}
                </button>
            </div>

            {/* 5. Uslovno prikazivanje liste događaja */}
            {!isMinimized && (
                <ul style={listStyle}>
                    {events.map((event, index) => (
                        <li key={event.id} style={index === events.length - 1 ? lastListItemStyle : listItemStyle}>
                            <Link to={`/events/${event.id}`}>{event.naslov}</Link>
                            <div style={{ fontSize: '0.8em', color: '#6c757d' }}>
                                Ukupno reakcija: {event.likeCount + event.dislikeCount}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TopReactionsBlock;