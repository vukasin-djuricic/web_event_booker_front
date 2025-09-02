// src/pages/EventDetailsPage.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext'; // Importujemo AuthContext
import {
    getEventById, getCommentsForEvent, addComment, incrementView, likeEvent, dislikeEvent,
    getRsvpCount, createRsvp // Dodajemo nove API funkcije
} from '../services/api';
import './Form.css';
import '../components/EventCard.css';
import '../App.css';

function EventDetailsPage() {
    const { user } = useContext(AuthContext); // Dohvatamo ulogovanog korisnika

    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState({ imeAutora: '', tekstKomentara: '' });
    const [commentError, setCommentError] = useState('');
    const [hasVotedOnEvent, setHasVotedOnEvent] = useState(false);

    // RSVP state-ovi
    const [rsvpCount, setRsvpCount] = useState(0);
    const [hasRsvpd, setHasRsvpd] = useState(false);
    const [rsvpIdentifier, setRsvpIdentifier] = useState('');
    const [rsvpError, setRsvpError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Provera za view count
                const viewedKey = `viewed_event_${id}`;
                if (!sessionStorage.getItem(viewedKey)) {
                    await incrementView(id);
                    sessionStorage.setItem(viewedKey, 'true');
                }

                // Provera za glasanje
                const votedKey = `voted_event_${id}`;
                setHasVotedOnEvent(!!localStorage.getItem(votedKey));

                // Provera da li je korisnik već RSVP-ovao
                const rsvpKey = `rsvpd_event_${id}`;
                setHasRsvpd(!!localStorage.getItem(rsvpKey));

                // Dohvatanje svih podataka istovremeno
                const [eventResponse, commentsResponse, rsvpResponse] = await Promise.all([
                    getEventById(id),
                    getCommentsForEvent(id),
                    getRsvpCount(id).catch(() => ({ data: { count: 0 } })) // Uhvati grešku ako RSVP nije omogućen
                ]);

                setEvent(eventResponse.data);
                setComments(commentsResponse.data);
                setRsvpCount(rsvpResponse.data.count);

                // Ako je korisnik ulogovan, automatski popuni polje za prijavu
                if (user) {
                    setRsvpIdentifier(user.email);
                }

            } catch (error) {
                console.error("Greška pri dohvatanju podataka:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, user]);

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
            setRsvpError(err.response?.data || 'Došlo je do greške prilikom prijave.');
        }
    };

    const handleCommentChange = (e) => {
        setNewComment({ ...newComment, [e.target.name]: e.target.value });
    };

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
            const commentsResponse = await getCommentsForEvent(id);
            setComments(commentsResponse.data);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setCommentError('Greška pri slanju komentara.');
        }
    };

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

    // Funkcija handleCommentVote() je sada POTPUNO UKLONJENA

    if (loading) return <p>Učitavanje detalja događaja...</p>;
    if (!event) return <p>Događaj nije pronađen.</p>;
    const isCapacityFull = event.maxKapacitet && rsvpCount >= event.maxKapacitet;


    return (
        <div style={{ paddingBottom: '2rem' }}>
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
                <div className="rsvp-section" style={{marginBottom: '2rem'}}>
                    <h2>Prijave (RSVP)</h2>
                    <div className="card" style={{padding: '1.5rem'}}>
                        <p><strong>Broj prijavljenih:</strong> {rsvpCount} / {event.maxKapacitet}</p>

                        {hasRsvpd ? (
                            <p style={{color: 'green', fontWeight: 'bold'}}>Uspešno ste prijavljeni!</p>
                        ) : isCapacityFull ? (
                            <p style={{color: 'red', fontWeight: 'bold'}}>Kapacitet je popunjen.</p>
                        ) : (
                            <div className="form-container" style={{margin: '0', padding: '0'}}>
                                <form onSubmit={handleRsvpSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="rsvpIdentifier">Vaše ime ili email</label>
                                        <input
                                            type="text"
                                            id="rsvpIdentifier"
                                            value={rsvpIdentifier}
                                            onChange={(e) => setRsvpIdentifier(e.target.value)}
                                            disabled={!!user} // Onemogući promenu ako je korisnik ulogovan
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
                <div className="form-container" style={{margin: '0 0 2rem 0', padding: '1.5rem'}}>
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

                {/* ===== POJEDNOSTAVLJEN PRIKAZ KOMENTARA ===== */}
                {comments.length > 0 ? (
                    comments.map(comment => (
                        <div key={comment.id} className="card" style={{marginBottom: '1rem'}}>
                            <p>{comment.tekstKomentara}</p>
                            <div className="card-footer" style={{borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <span>Autor: {comment.imeAutora}</span>
                                <span>{new Date(comment.datumKreiranja).toLocaleString()}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Nema komentara za ovaj događaj. Budite prvi!</p>
                )}
            </div>
        </div>
    );
}

export default EventDetailsPage;