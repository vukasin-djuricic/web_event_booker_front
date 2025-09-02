// src/pages/MostVisitedPage.jsx

import { useState, useEffect } from 'react';
import { getMostVisitedEvents } from '../services/api';
import EventCard from '../components/EventCard';
import '../App.css'; // Za .events-list

function MostVisitedPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMostVisited = async () => {
            try {
                setLoading(true);
                const response = await getMostVisitedEvents();
                setEvents(response.data);
            } catch (err) {
                setError('Nije moguće učitati najposećenije događaje.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMostVisited();
    }, []);

    if (loading) return <p>Učitavanje...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h1>Najposećeniji događaji u poslednjih 30 dana</h1>
            {events.length > 0 ? (
                <div className="events-list">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <p>Nema popularnih događaja u poslednjih 30 dana.</p>
            )}
        </div>
    );
}

export default MostVisitedPage;