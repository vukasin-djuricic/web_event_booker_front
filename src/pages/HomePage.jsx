// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { getAllEvents } from '../services/api';
import EventCard from '../components/EventCard';

function HomePage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLatestEvents = async () => {
            try {
                setLoading(true);
                // Tražimo prvu stranicu sa 10 najnovijih događaja
                const response = await getAllEvents(1, 10);

                // Proveravamo da li podaci postoje u očekivanom formatu
                if (response.data && response.data.data) {
                    setEvents(response.data.data);
                } else {
                    setEvents([]);
                }
            } catch (error) {
                console.error("Greška pri dohvatanju događaja:", error);
                setError('Nije moguće učitati najnovije događaje.');
            } finally {
                setLoading(false);
            }
        };
        fetchLatestEvents();
    }, []);

    if (loading) return <p>Učitavanje...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h1>Najnoviji Događaji</h1>
            {events.length > 0 ? (
                <div className="events-list">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <p>Trenutno nema dostupnih događaja.</p>
            )}
        </div>
    );
}

export default HomePage;