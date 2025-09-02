// src/components/TopReactionsBlock.jsx

import { useState, useEffect } from 'react';
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
    zIndex: 100
};

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

    if (loading || events.length === 0) {
        // Ne prikazujemo ništa ako se učitava ili ako nema događaja
        return null;
    }

    return (
        <div style={blockStyle}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Najviše reakcija</h4>
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
        </div>
    );
}

export default TopReactionsBlock;