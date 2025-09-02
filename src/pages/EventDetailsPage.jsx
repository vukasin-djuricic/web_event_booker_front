// src/pages/EventDetailsPage.jsx

import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    getEventById,
    getCommentsForEvent,
    addComment,
    incrementView,
    likeEvent,
    dislikeEvent,
    getRsvpCount,
    createRsvp,
    likeComment,
    dislikeComment,
    getRelatedEvents
} from '../services/api';
import EventCard from '../components/EventCard';
import './Form.css';
import '../components/EventCard.css';
import '../App.css';

function EventDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Glavni state-ovi
    const [event, setEvent] = useState(null);
    const [comments, setComments] = useState([]);
    const [relatedEvents, setRelatedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State za komentare
    const [newComment, setNewComment] = useState({ imeAutora: '', tekstKomentara: '' });
    const [commentError, setCommentError] = useState('');

    // State za RSVP
    const [rsvpCount, setRsvpCount] = useState(0);
    const [hasRsvpd, setHasRsvpd] = useState(false);
    const [rsvpIdentifier, setRsvpIdentifier] = useState('');
    const [rsvpError, setRsvpError] = useState('');

    // State za glasanje
    const [hasVotedOnEvent, setHasVotedOnEvent] = useState(false);
    const [votedComments, setVotedComments] = useState({});

    // Glavni useEffect za dohvatanje svih podataka
    useEffect(() => {
        // Koristimo AbortController da otkažemo zahteve ako korisnik brzo napusti stranicu
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                // Resetujemo stanje pre svakog novog dohvatanja
                setLoading(true);
                setError('');
                setEvent(null);

                // Provera za glasanje na događaju (iz localStorage)
                setHasVotedOnEvent(!!localStorage.getItem(`voted_event_${id}`));

                // Provera za RSVP (iz localStorage)
                setHasRsvpd(!!localStorage.getItem(`rsvpd_event_${id}`));

                // Učitavanje glasova za komentare za ovaj događaj
                const savedVotes = localStorage.getItem(`voted_comments_event_${id}`);
                setVotedComments(savedVotes ? JSON.parse(savedVotes) : {});

                // Povećanje broja poseta (koristimo sessionStorage da se broji samo jednom po sesiji)
                const viewedKey = `viewed_event_${id}`;
                if (!sessionStorage.getItem(viewedKey)) {
                    await incrementView(id);
                    sessionStorage.setItem(viewedKey, 'true');
                }

                // Paralelno dohvatanje svih potrebnih podataka
                const [eventResponse, commentsResponse, relatedResponse, rsvpResponse] = await Promise.all([
                    getEventById(id),
                    getCommentsForEvent(id),
                    getRelatedEvents(id),
                    getRsvpCount(id).catch(() => ({ data: { count: 0 } })) // Neuspeh nije kritičan
                ]);

                // Postavljanje podataka u state
                setEvent(eventResponse.data);
                setComments(commentsResponse.data);
                setRelatedEvents(relatedResponse.data);
                setRsvpCount(rsvpResponse.data.count);

                // Ako je korisnik ulogovan, popunjavamo njegovo ime za RSVP
                if (user) {
                    setRsvpIdentifier(user.email);
                }

            } catch (err) {
                console.error("Greška pri dohvatanju podataka:", err);
                setError('Nije moguće učitati podatke za događaj. Možda je obrisan ili ne postoji.');
                // Ako je greška 404, možemo preusmeriti korisnika
                if (err.response && err.response.status === 404) {
                    setTimeout(() => navigate('/'), 3000); // Vrati na početnu nakon 3 sekunde
                }
            } finally {
                // Proveravamo da li je zahtev otkazan pre nego što setujemo loading na false
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        // Cleanup funkcija - ovo se izvršava kada korisnik napusti stranicu
        return () => {
            controller.abort();
        };
    }, [id, user, navigate]);

    // Efekat koji čuva glasove za komentare u localStorage
    useEffect(() => {
        localStorage.setItem(`voted_comments_event_${id}`, JSON.stringify(votedComments));
    }, [votedComments, id]);

    // Handler za glasanje na događaju
    const handleEventVote = async (type) => {
        if (hasVotedOnEvent) return;
        try {
            const response = type === 'like' ? await likeEvent(id) : await dislikeEvent(id);
            setEvent(response.data);
            setHasVotedOnEvent(true);
            localStorage.setItem(`voted_event_${id}`, 'true');
        } catch (error) {
            console.error("Greška pri glasanju za događaj:", error);
        }
    };

    // Handler za glasanje na komentarima
    const handleCommentVote = async (commentId, type) => {
        if (votedComments[commentId]) return;
        try {
            const response = type === 'like' ? await likeComment(commentId) : await dislikeComment(commentId);
            setComments(currentComments => currentComments.map(c => c.id === commentId ? response.data : c));
            setVotedComments(prev => ({ ...prev, [commentId]: true }));
        } catch (error) {
            console.error("Greška pri glasanju za komentar:", error);
        }
    };

    // Handleri za dodavanje novog komentara
    const handleCommentChange = (e) => setNewComment({ ...newComment, [e.target.name]: e.target.value });
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.imeAutora.trim() || !newComment.tekstKomentara.trim()) {
            setCommentError('Oba polja su obavezna.');
            return;
        }
        try {
            await addComment(id, newComment);
            setNewComment({ imeAutora: '', tekstKomentara: '' });
            setCommentError('');
            const commentsResponse = await getCommentsForEvent(id); // Osveži listu komentara
            setComments(commentsResponse.data);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setCommentError('Greška pri slanju komentara.');
        }
    };

    // Handler za RSVP
    const handleRsvpSubmit = async (e) => {
        e.preventDefault();
        setRsvpError('');
        if (!rsvpIdentifier.trim()) {
            setRsvpError('Molimo unesite vaše ime ili email.');
            return;
        }
        try {
            await createRsvp(id, { userIdentifier: rsvpIdentifier });
            setHasRsvpd(true);
            setRsvpCount(prev => prev + 1);
            localStorage.setItem(`rsvpd_event_${id}`, 'true');
        } catch (err) {
            setRsvpError(err.response?.data?.message || err.response?.data || 'Došlo je do greške prilikom prijave.');
        }
    };

    if (loading) return <p style={{ textAlign: 'center', fontSize: '1.2rem' }}>Učitavanje detalja događaja...</p>;
    if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;
    if (!event) return <p style={{ textAlign: 'center' }}>Događaj nije pronađen.</p>;

    const isCapacityFull = event.maxKapacitet != null && rsvpCount >= event.maxKapacitet;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            {/* ... JSX kod ... */}
            <h1>{event.naslov}</h1>
            <div style={{ color: '#6c757d', marginBottom: '1rem' }}>
                <span>Pogledano: {event.brojPoseta} puta</span>
            </div>
            <p><strong>Lokacija:</strong> {event.lokacija}</p>
            <p><strong>Vreme održavanja:</strong> {new Date(event.datumOdrzavanja).toLocaleString()}</p>
            <p style={{whiteSpace: 'pre-wrap'}}>{event.opis}</p>
            <p><strong>Autor:</strong> {event.author.ime} {event.author.prezime}</p>
            <div>
                <strong>Tagovi:</strong>
                {event.tags.map((tag, index) => (
                    <span key={tag.id} style={{ marginLeft: '5px' }}>
                        <Link to={`/tag/${tag.id}`} className="tag-link">{tag.naziv}</Link>
                        {index < event.tags.length - 1 ? ',' : ''}
                    </span>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
                <button onClick={() => handleEventVote('like')} disabled={hasVotedOnEvent} style={{ cursor: hasVotedOnEvent ? 'not-allowed' : 'pointer' }}>
                    👍 Like ({event.likeCount})
                </button>
                <button onClick={() => handleEventVote('dislike')} disabled={hasVotedOnEvent} style={{ marginLeft: '1rem', backgroundColor: '#6c757d', cursor: hasVotedOnEvent ? 'not-allowed' : 'pointer' }}>
                    👎 Dislike ({event.dislikeCount})
                </button>
            </div>

            {/* RSVP SEKCIJA */}
            {event.maxKapacitet != null && (
                <div className="rsvp-section" style={{margin: '2rem 0'}}>
                    <hr/>
                    <h2 style={{marginTop: '2rem'}}>Prijave (RSVP)</h2>
                    <div className="card" style={{padding: '1.5rem'}}>
                        <p><strong>Broj prijavljenih:</strong> {rsvpCount} / {event.maxKapacitet}</p>

                        {hasRsvpd ? (
                            <p style={{color: 'green', fontWeight: 'bold'}}>Uspešno ste prijavljeni!</p>
                        ) : isCapacityFull ? (
                            <p style={{color: 'red', fontWeight: 'bold'}}>Kapacitet je popunjen.</p>
                        ) : (
                            <div className="form-container" style={{margin: '0', padding: '0', boxShadow: 'none'}}>
                                <form onSubmit={handleRsvpSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="rsvpIdentifier">Vaše ime ili email</label>
                                        <input
                                            type="text"
                                            id="rsvpIdentifier"
                                            value={rsvpIdentifier}
                                            onChange={(e) => setRsvpIdentifier(e.target.value)}
                                            disabled={!!user}
                                            required
                                        />
                                    </div>
                                    {rsvpError && <p className="form-error">{rsvpError}</p>}
                                    <button type="submit">Prijavi se (RSVP)</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <hr style={{margin: '3rem 0'}} />

            <div className="comments-section">
                <h2>Komentari ({comments.length})</h2>
                <div className="form-container" style={{margin: '0 0 2rem 0', padding: '1.5rem', boxShadow: 'none'}}>
                    <h4>Ostavi komentar</h4>
                    <form onSubmit={handleCommentSubmit}>
                        <div className="form-group">
                            <label htmlFor="imeAutora">Ime</label>
                            <input type="text" id="imeAutora" name="imeAutora" value={newComment.imeAutora} onChange={handleCommentChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="tekstKomentara">Komentar</label>
                            <textarea id="tekstKomentara" name="tekstKomentara" value={newComment.tekstKomentara} onChange={handleCommentChange} required style={{width: '100%', padding: '0.8rem', minHeight: '100px', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}></textarea>
                        </div>
                        {commentError && <p className="form-error">{commentError}</p>}
                        <button type="submit">Pošalji</button>
                    </form>
                </div>

                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="card" style={{marginBottom: '1rem'}}>
                            <p>{comment.tekstKomentara}</p>
                            <div className="card-footer" style={{borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div>
                                    <span>Autor: {comment.imeAutora}</span><br/>
                                    <small>{new Date(comment.datumKreiranja).toLocaleString()}</small>
                                </div>
                                <div>
                                    <button onClick={() => handleCommentVote(comment.id, 'like')} disabled={votedComments[comment.id]} style={{padding: '5px 10px', fontSize: '0.8em', marginRight: '5px', cursor: votedComments[comment.id] ? 'not-allowed' : 'pointer'}}>
                                        👍 ({comment.likeCount})
                                    </button>
                                    <button onClick={() => handleCommentVote(comment.id, 'dislike')} disabled={votedComments[comment.id]} style={{padding: '5px 10px', fontSize: '0.8em', backgroundColor: '#6c757d', cursor: votedComments[comment.id] ? 'not-allowed' : 'pointer'}}>
                                        👎 ({comment.dislikeCount})
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Nema komentara za ovaj događaj. Budite prvi!</p>
                )}
            </div>

            {relatedEvents.length > 0 && (
                <div className="related-events-section" style={{ marginTop: '4rem' }}>
                    <hr />
                    <h2 style={{ marginTop: '2rem' }}>Pročitaj još...</h2>
                    <div className="events-list">
                        {relatedEvents.map(relatedEvent => (
                            <EventCard key={relatedEvent.id} event={relatedEvent} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventDetailsPage;