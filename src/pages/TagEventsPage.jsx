// src/pages/TagEventsPage.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventsByTag } from '../services/api';
import EventCard from '../components/EventCard';
import '../App.css';

function TagEventsPage() {
    const { id } = useParams();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Paginacija
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                setError('');
                const response = await getEventsByTag(id, currentPage, ITEMS_PER_PAGE);
                setEvents(response.data.data);
                setTotalPages(Math.ceil(response.data.totalCount / ITEMS_PER_PAGE));
            } catch (err) {
                setError("Greška pri dohvatanju događaja.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [id, currentPage]);

    // Resetuj stranicu na 1 kada se promeni ID taga
    useEffect(() => {
        setCurrentPage(1);
    }, [id]);

    if (isLoading) return <p>Učitavanje događaja...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>;

    return (
        <div>
            <h1>Događaji sa tagom</h1>
            {events.length > 0 ? (
                <>
                    <div className="events-list">
                        {events.map(event => <EventCard key={event.id} event={event} />)}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>&laquo; Prethodna</button>
                            <span>Stranica {currentPage} od {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Sledeća &raquo;</button>
                        </div>
                    )}
                </>
            ) : (
                <p>Trenutno nema događaja sa ovim tagom.</p>
            )}
        </div>
    );
}

export default TagEventsPage;