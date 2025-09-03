// src/pages/CategoryEventsPage.jsx

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventsByCategory, getAllCategories } from '../services/api'; // Dodajemo getAllCategories
import EventCard from '../components/EventCard';
import '../App.css';

function CategoryEventsPage() {
    const { id } = useParams();
    const [events, setEvents] = useState([]);
    const [categoryName, setCategoryName] = useState(''); // State za čuvanje imena kategorije
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Paginacija state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        const fetchEventsAndCategory = async () => {
            try {
                setIsLoading(true);
                setError('');

                // Paralelno dohvatanje događaja i detalja o kategoriji
                const [eventsResponse, categoriesResponse] = await Promise.all([
                    getEventsByCategory(id, currentPage, ITEMS_PER_PAGE),
                    getAllCategories(1, 100) // Dohvatamo sve kategorije da nađemo ime
                ]);

                // Postavljanje podataka o događajima i paginaciji
                if (eventsResponse.data && eventsResponse.data.data) {
                    setEvents(eventsResponse.data.data);
                    setTotalPages(Math.ceil(eventsResponse.data.totalCount / ITEMS_PER_PAGE));
                }

                // Pronalaženje i postavljanje imena kategorije za naslov
                if (categoriesResponse.data && categoriesResponse.data.data) {
                    const currentCategory = categoriesResponse.data.data.find(cat => cat.id === Number(id));
                    if (currentCategory) {
                        setCategoryName(currentCategory.name);
                    }
                }

            } catch (err) {
                setError("Greška pri dohvatanju događaja.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEventsAndCategory();
    }, [id, currentPage]);

    // Resetuj stranicu na 1 kada se promeni ID kategorije
    useEffect(() => {
        setCurrentPage(1);
    }, [id]);

    if (isLoading) return <p>Učitavanje događaja...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            {/* Dinamički naslov */}
            <h1>Događaji u kategoriji: {categoryName || `ID ${id}`}</h1>

            {events.length > 0 ? (
                <>
                    <div className="events-list">
                        {events.map(event => <EventCard key={event.id} event={event} />)}
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
                <p>Trenutno nema događaja u ovoj kategoriji.</p>
            )}
        </div>
    );
}

export default CategoryEventsPage;