// src/pages/HomePage.jsx

import { useState, useEffect } from 'react';
import { getAllEvents } from '../services/api';
import EventCard from '../components/EventCard';
import '../App.css';

function HomePage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State za paginaciju
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 9; // Prikazujemo 9 događaja po stranici (3x3 grid)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError('');
                // Sada pozivamo API sa trenutnom stranicom
                const response = await getAllEvents(currentPage, ITEMS_PER_PAGE);

                if (response.data && response.data.data) {
                    setEvents(response.data.data);
                    setTotalPages(Math.ceil(response.data.totalCount / ITEMS_PER_PAGE));
                } else {
                    setEvents([]);
                    setTotalPages(0);
                }
            } catch (err) {
                console.error("Greška pri dohvatanju događaja:", err);
                setError('Nije moguće učitati događaje.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [currentPage]); // useEffect se ponovo pokreće svaki put kad se promeni currentPage

    if (loading) return <p>Učitavanje...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h1>Svi Događaji</h1>
            {events.length > 0 ? (
                <>
                    <div className="events-list">
                        {events.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>

                    {/* Kontrole za paginaciju */}
                    {totalPages > 1 && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                                &laquo; Prethodna
                            </button>
                            <span>
                                Stranica {currentPage} od {totalPages}
                            </span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                                Sledeća &raquo;
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <p>Trenutno nema dostupnih događaja.</p>
            )}
        </div>
    );
}

export default HomePage;