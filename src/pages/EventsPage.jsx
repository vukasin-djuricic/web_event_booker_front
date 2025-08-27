// src/pages/EventsPage.jsx
import { useState, useEffect, useContext } from 'react';
import { getAllEvents, createEvent, updateEvent, deleteEvent, getAllCategories, getAllTags } from '../services/api';
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

    useEffect(() => {
        // Učitaj sve podatke potrebne za stranicu
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
                    // Postavi podrazumevanu kategoriju u formi
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

        // Pripremi podatke za slanje
        const eventData = {
            ...currentEvent,
            authorId: user.userId, // Uzmi ID ulogovanog korisnika iz tokena
            maxKapacitet: currentEvent.maxKapacitet ? parseInt(currentEvent.maxKapacitet, 10) : null,
        };

        const action = isEditing
            ? updateEvent(currentEvent.id, eventData)
            : createEvent(eventData);

        try {
            await action;
            resetForm();
            // Ponovo učitaj samo događaje
            const eventsRes = await getAllEvents();
            setEvents(eventsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Došlo je do greške pri čuvanju događaja.');
        }
    };

    const handleEdit = (event) => {
        setIsEditing(true);
        setCurrentEvent({
            id: event.id,
            naslov: event.naslov,
            opis: event.opis,
            lokacija: event.lokacija,
            // Formatiranje datuma za datetime-local input
            datumOdrzavanja: event.datumOdrzavanja.slice(0, 16),
            maxKapacitet: event.maxKapacitet || '',
            categoryId: event.category.id,
            // Backend vraća imena tagova, ali nama trebaju ID-jevi. Moramo ih naći.
            tagIds: tags.filter(tag => event.tags.includes(tag.naziv)).map(tag => tag.id)
        });
        window.scrollTo(0, 0);
    };

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