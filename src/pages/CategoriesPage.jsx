// src/pages/CategoriesPage.jsx
import { useState, useEffect } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import './Table.css';
import './Form.css';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State za paginaciju
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 5; // Možete lako promeniti broj stavki po stranici

    // State za formu
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '' });

    // Učitaj kategorije kada se stranica promeni
    useEffect(() => {
        fetchCategories(currentPage);
    }, [currentPage]);

    const fetchCategories = async (page) => {
        try {
            setIsLoading(true);
            setError(''); // Resetuj grešku pre svakog dohvatanja
            const response = await getAllCategories(page, ITEMS_PER_PAGE);
            setCategories(response.data.data);
            setTotalPages(Math.ceil(response.data.totalCount / ITEMS_PER_PAGE));
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Greška pri učitavanju kategorija.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentCategory({ ...currentCategory, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentCategory.name || !currentCategory.description) {
            setError('Naziv i opis su obavezni.');
            return;
        }

        const action = isEditing
            ? updateCategory(currentCategory.id, { name: currentCategory.name, description: currentCategory.description })
            : createCategory({ name: currentCategory.name, description: currentCategory.description });

        try {
            await action;
            resetForm();
            // Ako smo bili na nekoj drugoj stranici, vrati se na prvu da vidimo novi unos
            if (currentPage !== 1 && !isEditing) {
                setCurrentPage(1);
            } else {
                await fetchCategories(currentPage); // U suprotnom, samo osveži trenutnu
            }
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Došlo je do greške. Proverite da li naziv već postoji.');
        }
    };

    const handleEdit = (category) => {
        setIsEditing(true);
        setCurrentCategory({ id: category.id, name: category.name, description: category.description });
        window.scrollTo(0, 0);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovu kategoriju?')) {
            try {
                await deleteCategory(id);
                // Ako je obrisana poslednja stavka na stranici, a to nije prva stranica, vrati se nazad.
                if (categories.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                } else {
                    // U suprotnom, samo osveži trenutnu stranicu.
                    await fetchCategories(currentPage);
                }
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Nije moguće obrisati kategoriju koja je u upotrebi.');
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentCategory({ id: null, name: '', description: '' });
        setError('');
    };

    return (
        <div>
            {/* Forma ostaje ista */}
            <div className="form-container" style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                <h2>{isEditing ? 'Izmeni Kategoriju' : 'Dodaj Novu Kategoriju'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Naziv</label>
                        <input type="text" id="name" name="name" value={currentCategory.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Opis</label>
                        <textarea id="description" name="description" value={currentCategory.description} onChange={handleInputChange} required style={{ width: '100%', padding: '0.8rem', minHeight: '80px', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }} />
                    </div>
                    <button type="submit">{isEditing ? 'Sačuvaj Izmene' : 'Dodaj Kategoriju'}</button>
                    {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>Otkaži</button>}
                    {error && <p className="form-error" style={{marginTop: '1rem'}}>{error}</p>}
                </form>
            </div>

            <div className="table-container">
                <div className="table-header">
                    <h2>Postojeće Kategorije</h2>
                </div>
                {isLoading ? <p>Učitavanje...</p> : (
                    <>
                        <table>
                            <thead>
                            <tr>
                                <th>Naziv</th>
                                <th>Opis</th>
                                <th>Akcije</th>
                            </tr>
                            </thead>
                            <tbody>
                            {categories.length > 0 ? categories.map((cat) => (
                                <tr key={cat.id}>
                                    <td>{cat.name}</td>
                                    <td>{cat.description}</td>
                                    <td className="actions">
                                        <button className="btn-edit" onClick={() => handleEdit(cat)}>Izmeni</button>
                                        <button className="btn-delete" onClick={() => handleDelete(cat.id)}>Obriši</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="3" style={{textAlign: 'center'}}>Nema unetih kategorija.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        {/* Paginacija kontrole */}
                        {totalPages > 1 && (
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
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
                )}
            </div>
        </div>
    );
}

export default CategoriesPage;