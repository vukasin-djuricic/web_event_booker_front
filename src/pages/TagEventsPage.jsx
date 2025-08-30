import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventsByTag } from '../services/api';
import EventCard from '../components/EventCard';

function TagEventsPage() {
    const { id } = useParams();
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // Možete dodati dohvatanje imena taga za naslov

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);
                const response = await getEventsByTag(id);
                setEvents(response.data);
            } catch (error) {
                console.error("Greška pri dohvatanju događaja po tagu:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, [id]);

    if (isLoading) return <p>Učitavanje događaja...</p>;

    return (
        <div>
            <h1>Događaji sa tagom</h1>
            <div className="events-list">
                {events.length > 0 ? (
                    events.map(event => <EventCard key={event.id} event={event} />)
                ) : (
                    <p>Trenutno nema događaja sa ovim tagom.</p>
                )}
            </div>
        </div>
    );
}
export default TagEventsPage;