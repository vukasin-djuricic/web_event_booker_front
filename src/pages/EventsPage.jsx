// src/pages/EventsPage.jsx
import { useState, useEffect, useContext } from 'react';
import { getAllEvents, createEvent, updateEvent, deleteEvent, getAllCategories, getAllTags, getEventById } from '../services/api'; // Dodat getEventById
import { AuthContext } from '../context/AuthContext';
import './Table.css';
import './Form.css';

const initialFormState = { id: null, naslov: '', opis: '', lokacija: '', datumOdrzavanja: '', maxKapacitet: '', categoryId: '', tagIds: [] };

function EventsPage() {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentEvent, setCurrentEvent] = useState(initialFormState);

    // Učitaj sve podatke potrebne za stranicu
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoading(true);
                const [eventsRes, categoriesRes, tagsRes] = await Promise.all([
                    getAllEvents(),
                    getAllCategories(),
                    getAllTags()
                ]);
                setEvents(eventsRes.data);
                setCategories(categoriesRes.data);
                setTags(tagsRes.data);
                if (categoriesRes.data.length > 0) {
                    setCurrentEvent(prev => ({...prev, categoryId: categoriesRes.data[0].id}));
                }
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Greška pri učitavanju podataka.');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentEvent({ ...currentEvent, [name]: value });
    };

    const handleTagChange = (e) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setCurrentEvent({ ...currentEvent, tagIds: selectedIds });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const eventData = {
            ...currentEvent,
            authorId: user.userId,
            maxKapacitet: currentEvent.maxKapacitet ? parseInt(currentEvent.maxKapacitet, 10) : null,
            // categoryId se već nalazi u state-u, kao i tagIds
        };

        const action = isEditing
            ? updateEvent(currentEvent.id, eventData)
            : createEvent(eventData);

        try {
            await action;
            resetForm();
            const eventsRes = await getAllEvents();
            setEvents(eventsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Došlo je do greške pri čuvanju događaja.');
        }
    };

    // ===== ISPRAVLJENA FUNKCIJA =====
    const handleEdit = async (eventToEdit) => {
        try {
            // 1. Dohvati sveže i kompletne podatke za taj događaj
            const { data: fullEvent } = await getEventById(eventToEdit.id);

            setIsEditing(true);
            setCurrentEvent({
                id: fullEvent.id,
                naslov: fullEvent.naslov,
                opis: fullEvent.opis,
                lokacija: fullEvent.lokacija,
                datumOdrzavanja: fullEvent.datumOdrzavanja.slice(0, 16),
                maxKapacitet: fullEvent.maxKapacitet || '',
                //categoryId: fullEvent.category.id, // Sad imamo ID kategorije
                categoryId: 2, // Privremeno hardkodirano dok nema kategorija
                tagIds: fullEvent.tags.map(tag => tag.id) // Sad imamo ID-jeve tagova
            });
            window.scrollTo(0, 0);
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            setError("Nije moguće učitati podatke za izmenu.");
        }
    };
    // ===================================

    const handleDelete = async (id) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovaj događaj?')) {
            try {
                await deleteEvent(id);
                const eventsRes = await getAllEvents();
                setEvents(eventsRes.data);
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Greška pri brisanju događaja.');
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentEvent({
            ...initialFormState,
            categoryId: categories.length > 0 ? categories[0].id : ''
        });
        setError('');
    };

    // ... JSX deo (return) ostaje potpuno isti kao u prethodnom odgovoru
    return (
        <div>
            {/* Forma */}
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

            {/* Tabela */}
            <div className="table-container">
                <div className="table-header"><h2>Postojeći Događaji</h2></div>
                {isLoading ? <p>Učitavanje...</p> : (
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
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => handleEdit(event)}>Izmeni</button>
                                    <button className="btn-delete" onClick={() => handleDelete(event.id)}>Obriši</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default EventsPage;