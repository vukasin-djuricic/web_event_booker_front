// src/pages/SearchPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchEvents } from '../services/api';
import EventCard from '../components/EventCard';
import '../App.css'; // Za .events-list

function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('query');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setResults([]);
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const response = await searchEvents(query);
                setResults(response.data);
            } catch (error) {
                console.error("Greška pri pretrazi:", error);
            } finally {
                setIsLoading(false);
            }
        };
        performSearch();
    }, [query]);

    if (isLoading) return <p>Pretraživanje...</p>;

    return (
        <div>
            <h1>Rezultati pretrage za: "{query}"</h1>
            {results.length > 0 ? (
                <div className="events-list">
                    {results.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            ) : (
                <p>Nema rezultata za traženi pojam.</p>
            )}
        </div>
    );
}
export default SearchPage;