// src/pages/CategoriesPage.jsx
import { useState, useEffect } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import './Table.css';
import './Form.css';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State za formu
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, name: '', description: '' });

    // Učitavanje kategorija sa servera
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await getAllCategories();
            setCategories(response.data);
            setError('');
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Greška pri učitavanju kategorija.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handler za promenu vrednosti u input poljima
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentCategory({ ...currentCategory, [name]: value });
    };

    // Handler za slanje forme (kreiranje ili ažuriranje)
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
            await fetchCategories();
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Došlo je do greške. Proverite da li naziv već postoji.');
        }
    };

    // Priprema forme za izmenu
    const handleEdit = (category) => {
        setIsEditing(true);
        setCurrentCategory({ id: category.id, name: category.name, description: category.description });
        window.scrollTo(0, 0); // Skroluj na vrh da se vidi forma
    };

    // Brisanje kategorije
    const handleDelete = async (id) => {
        if (window.confirm('Da li ste sigurni da želite da obrišete ovu kategoriju?')) {
            try {
                await deleteCategory(id);
                await fetchCategories();
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Nije moguće obrisati kategoriju koja je u upotrebi.');
            }
        }
    };

    // Resetovanje forme
    const resetForm = () => {
        setIsEditing(false);
        setCurrentCategory({ id: null, name: '', description: '' });
        setError('');
    };

    return (
        <div>
            {/* Forma za dodavanje/izmenu */}
            <div className="form-container" style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                <h2>{isEditing ? 'Izmeni Kategoriju' : 'Dodaj Novu Kategoriju'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Naziv</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={currentCategory.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Opis</label>
                        <textarea
                            id="description"
                            name="description"
                            value={currentCategory.description}
                            onChange={handleInputChange}
                            required
                            style={{ width: '100%', padding: '0.8rem', minHeight: '80px', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}
                        />
                    </div>
                    <button type="submit">{isEditing ? 'Sačuvaj Izmene' : 'Dodaj Kategoriju'}</button>
                    {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>Otkaži</button>}
                    {error && <p className="form-error" style={{marginTop: '1rem'}}>{error}</p>}
                </form>
            </div>

            {/* Tabela za prikaz kategorija */}
            <div className="table-container">
                <div className="table-header">
                    <h2>Postojeće Kategorije</h2>
                </div>
                {isLoading ? <p>Učitavanje...</p> : (
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
                )}
            </div>
        </div>
    );
}

export default CategoriesPage;