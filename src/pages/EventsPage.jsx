// src/pages/EventsPage.jsx

import { useState, useEffect, useContext } from 'react';
import {
    getAllEvents, createEvent, updateEvent, deleteEvent, getAllCategories, getAllTags, getEventById,
    getRsvpsForEvent
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Table.css';
import './Form.css';
import Modal from "../components/Modal.jsx";

// Inicijalno stanje forme
const initialFormState = {
    id: null,
    naslov: '',
    opis: '',
    lokacija: '',
    datumOdrzavanja: '',
    maxKapacitet: '',
    categoryId: '',
    tagIds: []
};

function EventsPage() {
    const { user } = useContext(AuthContext);

    // State za podatke
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);

    // State za UI
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(initialFormState);

    // State za paginaciju
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 5; // Definišemo koliko stavki želimo po stranici

    //RSVP STATES
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rsvps, setRsvps] = useState([]);
    const [selectedEventTitle, setSelectedEventTitle] = useState('');

    // Učitavamo podatke svaki put kada se promeni `currentPage`
    useEffect(() => {
        loadInitialData(currentPage);
    }, [currentPage]);

    // Funkcija za učitavanje svih potrebnih podataka
    const loadInitialData = async (page) => {
        try {
            setIsLoading(true);
            setError(''); // Resetuj grešku

            const [eventsRes, categoriesRes, tagsRes] = await Promise.all([
                getAllEvents(page, ITEMS_PER_PAGE),
                getAllCategories(1, 100), // Dohvati sve kategorije za dropdown
                getAllTags()              // Dohvati sve tagove za dropdown
            ]);

            // Postavljanje podataka iz API odgovora
            setEvents(eventsRes.data.data);
            setTotalPages(Math.ceil(eventsRes.data.totalCount / ITEMS_PER_PAGE));
            setCategories(categoriesRes.data.data); // Kategorije su takođe paginirane
            setTags(tagsRes.data);

            // Postavi podrazumevanu kategoriju u formi ako već nije postavljena
            if (categoriesRes.data.data.length > 0 && !currentEvent.categoryId) {
                setCurrentEvent(prev => ({ ...prev, categoryId: categoriesRes.data.data[0].id }));
            }
        } catch (err) {
            setError('Greška pri učitavanju podataka. Proverite da li je backend pokrenut.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handleri za promenu vrednosti u formi
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEvent({ ...currentEvent, [name]: value });
    };

    const handleTagChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value, 10));
        setCurrentEvent({ ...currentEvent, tagIds: selectedIds });
    };

    // Slanje forme (kreiranje ili ažuriranje)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const eventDataToSend = {
            naslov: currentEvent.naslov,
            opis: currentEvent.opis,
            lokacija: currentEvent.lokacija,
            datumOdrzavanja: currentEvent.datumOdrzavanja,
            maxKapacitet: currentEvent.maxKapacitet ? parseInt(currentEvent.maxKapacitet, 10) : null,
            categoryId: parseInt(currentEvent.categoryId, 10),
            tagIds: currentEvent.tagIds,
            authorId: user.userId
        };

        if (!eventDataToSend.categoryId) {
            setError("Molimo izaberite kategoriju.");
            return;
        }

        const action = isEditing
            ? updateEvent(currentEvent.id, eventDataToSend)
            : createEvent(eventDataToSend);

        try {
            await action;
            resetForm();
            // Ako smo dodali novi događaj, vrati se na prvu stranicu da ga vidimo
            // Ako smo ažurirali, osveži trenutnu stranicu
            if (!isEditing && currentPage !== 1) {
                setCurrentPage(1);
            } else {
                await loadInitialData(currentPage);
            }
        } catch (err) {
            const serverError = err.response?.data?.message || err.response?.data || 'Došlo je do greške pri čuvanju.';
            setError(typeof serverError === 'object' ? JSON.stringify(serverError) : serverError);
        }
    };

    // Priprema forme za izmenu
    const handleEdit = async (eventToEdit) => {
        try {
            const { data: fullEvent } = await getEventById(eventToEdit.id);
            setIsEditing(true);
            setCurrentEvent({
                id: fullEvent.id,
                naslov: fullEvent.naslov,
                opis: fullEvent.opis,
                lokacija: fullEvent.lokacija,
                datumOdrzavanja: fullEvent.datumOdrzavanja ? fullEvent.datumOdrzavanja.slice(0, 16) : '',
                maxKapacitet: fullEvent.maxKapacitet || '',
                categoryId: fullEvent.categoryId,
                tagIds: fullEvent.tags.map(tag => tag.id)
            });
            window.scrollTo(0, 0);
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            setError("Nije moguće učitati podatke za izmenu.");
        }
    };

    // Brisanje događaja
    const handleDelete = async (id) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovaj događaj?')) {
            try {
                await deleteEvent(id);
                // Ako je obrisana poslednja stavka na stranici, a to nije prva stranica, vrati se nazad.
                if (events.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    await loadInitialData(currentPage); // U suprotnom, osveži trenutnu
                }
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Greška pri brisanju događaja.');
            }
        }
    };

    const handleShowRsvps = async (eventId) => {
        try {
            const event = events.find(e => e.id === eventId);
            setSelectedEventTitle(event.naslov);
            const response = await getRsvpsForEvent(eventId);
            setRsvps(response.data);
            setIsModalOpen(true);
            // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setError("Greška pri dohvatanju prijava.");
        }
    };

    // Resetovanje forme na početne vrednosti
    const resetForm = () => {
        setIsEditing(false);
        setCurrentEvent({
            ...initialFormState,
            categoryId: categories.length > 0 ? categories[0].id : ''
        });
        setError('');
    };

    return (
        <div>
            {/* Forma za dodavanje/izmenu */}
            <div className="form-container" style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                <h2>{isEditing ? 'Izmeni Događaj' : 'Dodaj Novi Događaj'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="naslov">Naslov</label>
                        <input type="text" name="naslov" value={currentEvent.naslov} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="opis">Opis</label>
                        <textarea name="opis" value={currentEvent.opis} onChange={handleInputChange} required style={{ width: '100%', padding: '0.8rem', minHeight: '120px', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}/>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="lokacija">Lokacija</label>
                            <input type="text" name="lokacija" value={currentEvent.lokacija} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="datumOdrzavanja">Datum i Vreme</label>
                            <input type="datetime-local" name="datumOdrzavanja" value={currentEvent.datumOdrzavanja} onChange={handleInputChange} required />
                        </div>
                    </div>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="categoryId">Kategorija</label>
                            <select name="categoryId" value={currentEvent.categoryId} onChange={handleInputChange} required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}>
                                <option value="">-- Izaberi kategoriju --</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="maxKapacitet">Max Kapacitet (opciono)</label>
                            <input type="number" name="maxKapacitet" value={currentEvent.maxKapacitet} onChange={handleInputChange} min="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="tagIds">Tagovi (držite Ctrl ili Cmd za više opcija)</label>
                        <select multiple name="tagIds" value={currentEvent.tagIds} onChange={handleTagChange} style={{ width: '100%', padding: '0.8rem', minHeight: '150px', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}>
                            {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.naziv}</option>)}
                        </select>
                    </div>
                    <button type="submit">{isEditing ? 'Sačuvaj Izmene' : 'Dodaj Događaj'}</button>
                    {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>Otkaži</button>}
                    {error && <p className="form-error">{error}</p>}
                </form>
            </div>

            {/* Tabela za prikaz događaja */}
            <div className="table-container">
                <div className="table-header"><h2>Postojeći Događaji</h2></div>
                {isLoading ? <p>Učitavanje...</p> : (
                    <>
                        <table>
                            <thead>
                            <tr>
                                <th>Naslov</th>
                                <th>Kategorija</th>
                                <th>Datum Održavanja</th>
                                <th>Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>{event.naslov}</td>
                                    <td>{event.categoryName}</td>
                                    <td>{new Date(event.datumOdrzavanja).toLocaleString()}</td>
                                    <td>
                                        {event.maxKapacitet != null ?
                                            <button onClick={() => handleShowRsvps(event.id)}>Pregled Prijava</button> :
                                            'N/A'
                                        }
                                    </td>
                                    <td className="actions">
                                        <button className="btn-edit" onClick={() => handleEdit(event)}>Izmeni</button>
                                        <button className="btn-delete" onClick={() => handleDelete(event.id)}>Obriši</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {/* Kontrole za paginaciju */}
                        {totalPages > 1 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>&laquo; Prethodna</button>
                                <span>Stranica {currentPage} od {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Sledeća &raquo;</button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Prijave za: ${selectedEventTitle}`}>
                {rsvps.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {rsvps.map(rsvp => (
                            <li key={rsvp.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                                <strong>{rsvp.userIdentifier}</strong> - Prijavljen: {new Date(rsvp.rsvpDate).toLocaleString()}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Nema prijavljenih za ovaj događaj.</p>
                )}
            </Modal>
        </div>
    );


}
export default EventsPage;