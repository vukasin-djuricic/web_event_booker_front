// src/pages/SearchPage.jsx

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchEvents } from '../services/api';
import EventCard from '../components/EventCard';
import '../App.css';

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('query');

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Paginacija state
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 9;

    useEffect(() => {
        // Resetuj stranicu na 1 ako se promeni query
        const pageQuery = searchParams.get('page');
        if (!pageQuery) {
            setCurrentPage(1);
        }

        const performSearch = async () => {
            if (!query) {
                setResults([]);
                return;
            }
            try {
                setIsLoading(true);
                setError('');
                const response = await searchEvents(query, currentPage, ITEMS_PER_PAGE);
                setResults(response.data.data);
                setTotalPages(Math.ceil(response.data.totalCount / ITEMS_PER_PAGE));
            } catch (err) {
                setError("Greška pri pretrazi događaja.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
        // Ne treba setSearchParams ovde da se izbegne re-render loop

    }, [query, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setSearchParams({ query, page: newPage });
        }
    };

    if (isLoading) return <p>Pretraživanje...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>

    return (
        <div>
            <h1>Rezultati pretrage za: "{query}"</h1>
            {results.length > 0 ? (
                <>
                    <div className="events-list">
                        {results.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>&laquo; Prethodna</button>
                            <span>Stranica {currentPage} od {totalPages}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Sledeća &raquo;</button>
                        </div>
                    )}
                </>
            ) : (
                <p>Nema rezultata za traženi pojam.</p>
            )}
        </div>
    );
}

export default SearchPage;