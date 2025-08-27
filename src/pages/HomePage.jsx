import { useState, useEffect } from 'react';
import { getAllEvents } from '../services/api';
import EventCard from '../components/EventCard'; // Kreiraćemo ovu komponentu

function HomePage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await getAllEvents();
                // Backend vraća sve, sortiramo i uzimamo prvih 10
                const sortedEvents = response.data.sort((a, b) => new Date(b.vremeKreiranja) - new Date(a.vremeKreiranja));
                setEvents(sortedEvents.slice(0, 10));
            } catch (error) {
                console.error("Greška pri dohvatanju događaja:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    if (loading) return <p>Učitavanje...</p>;

    return (
        <div>
            <h1>Najnoviji Događaji</h1>
            <div className="events-list"> {/* DODAJEMO KLASU OVDE */}
                {events.map(event => (
                    <EventCard key={event.id} event={event} />
                ))}
            </div>
        </div>
    );
}

export default HomePage;