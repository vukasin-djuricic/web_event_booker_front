// src/pages/EmsSearchPage.jsx

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchEvents } from '../services/api';
import EventCard from '../components/EventCard'; // Nije potrebno
import '../App.css';
import './Table.css'; // Treba nam stil za tabelu

function EmsSearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('query');

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Paginacija state
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
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
            <div className="table-container">
                {results.length > 0 ? (
                    <>
                        <table>
                            <thead>
                            <tr>
                                <th>Naslov</th>
                                <th>Kategorija</th>
                                <th>Autor</th>
                                <th>Datum Održavanja</th>
                            </tr>
                            </thead>
                            <tbody>
                            {results.map((event) => (
                                <tr key={event.id}>
                                    <td>
                                        <Link to={`/events/${event.id}`} target="_blank" rel="noopener noreferrer">
                                            {event.naslov}
                                        </Link>
                                    </td>
                                    <td>{event.categoryName}</td>
                                    <td>{event.author.ime} {event.author.prezime}</td>
                                    <td>{new Date(event.datumOdrzavanja).toLocaleString()}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
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
        </div>
    );
}

export default EmsSearchPage;