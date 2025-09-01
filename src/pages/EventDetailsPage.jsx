// src/pages/EventDetailsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    getEventById,
    getCommentsForEvent,
    addComment,
    incrementView,
    likeEvent,
    dislikeEvent
} from '../services/api'; // Uklonjeni importi za like/dislike komentara
import './Form.css';
import '../components/EventCard.css';
import '../App.css';

function EventDetailsPage() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState({ imeAutora: '', tekstKomentara: '' });
    const [commentError, setCommentError] = useState('');
    const [hasVotedOnEvent, setHasVotedOnEvent] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const viewedKey = `viewed_event_${id}`;
                if (!sessionStorage.getItem(viewedKey)) {
                    await incrementView(id);
                    sessionStorage.setItem(viewedKey, 'true');
                }

                const votedKey = `voted_event_${id}`;
                if (localStorage.getItem(votedKey)) {
                    setHasVotedOnEvent(true);
                }

                const [eventResponse, commentsResponse] = await Promise.all([
                    getEventById(id),
                    getCommentsForEvent(id)
                ]);
                setEvent(eventResponse.data);
                setComments(commentsResponse.data);

            } catch (error) {
                console.error("Greška pri dohvatanju podataka:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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