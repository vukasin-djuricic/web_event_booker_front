// src/pages/AdminUsersPage.jsx

import { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUser, toggleUserStatus } from '../services/api';
import './Table.css';
import './Form.css';

// ===== ISPRAVKA: DEKLARACIJA PREMEŠTENA OVDE =====
const initialFormState = {
    id: null,
    ime: '',
    prezime: '',
    email: '',
    userType: 'EVENT_CREATOR',
    lozinka: '',
    potvrdaLozinke: ''
};

function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(initialFormState);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await getAllUsers();
            setUsers(response.data);
            setError('');
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Greška pri učitavanju korisnika.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentUser({ ...currentUser, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isEditing && currentUser.lozinka !== currentUser.potvrdaLozinke) {
            setError('Lozinke se ne poklapaju.');
            return;
        }

        const userData = { ...currentUser };
        delete userData.potvrdaLozinke;

        const action = isEditing
            ? updateUser(currentUser.id, { ime: userData.ime, prezime: userData.prezime, email: userData.email, userType: userData.userType })
            : createUser(userData);

        try {
            await action;
            resetForm();
            await fetchUsers();
        } catch (err) {
            setError(err.response?.data || 'Došlo je do greške. Proverite da li email već postoji.');
        }
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setCurrentUser({ ...user, lozinka: '', potvrdaLozinke: '' });
        window.scrollTo(0, 0);
    };

    const handleToggleStatus = async (user) => {
        if (user.userType === 'ADMIN') {
            alert('Admin nalog ne može biti deaktiviran.');
            return;
        }
        if (window.confirm(`Da li ste sigurni da želite da ${user.active ? 'deaktivirate' : 'aktivirate'} nalog ${user.email}?`)) {
            try {
                await toggleUserStatus(user.id);
                await fetchUsers();
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('Greška pri promeni statusa korisnika.');
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentUser(initialFormState);
        setError('');
    };

    return (
        <div>
            <div className="form-container" style={{ maxWidth: 'none', marginBottom: '2rem' }}>
                <h2>{isEditing ? 'Izmeni Korisnika' : 'Dodaj Novog Korisnika'}</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{display: 'flex', gap: '1rem'}}>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="ime">Ime</label>
                            <input type="text" name="ime" value={currentUser.ime} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group" style={{flex: 1}}>
                            <label htmlFor="prezime">Prezime</label>
                            <input type="text" name="prezime" value={currentUser.prezime} onChange={handleInputChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" name="email" value={currentUser.email} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="userType">Tip Korisnika</label>
                        <select name="userType" value={currentUser.userType} onChange={handleInputChange} required style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '1rem' }}>
                            <option value="EVENT_CREATOR">Event Creator</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    {!isEditing && (
                        <>
                            <div className="form-group">
                                <label htmlFor="lozinka">Lozinka</label>
                                <input type="password" name="lozinka" value={currentUser.lozinka} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="potvrdaLozinke">Potvrdi Lozinku</label>
                                <input
                                    type="password"
                                    name="potvrdaLozinke"
                                    value={currentUser.potvrdaLozinke}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </>
                    )}
                    <button type="submit">{isEditing ? 'Sačuvaj Izmene' : 'Dodaj Korisnika'}</button>
                    {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>Otkaži</button>}
                    {error && <p className="form-error">{typeof error === 'string' ? error : JSON.stringify(error)}</p>}
                </form>
            </div>

            <div className="table-container">
                <div className="table-header"><h2>Postojeći Korisnici</h2></div>
                {isLoading ? <p>Učitavanje...</p> : (
                    <table>
                        <thead>
                        <tr>
                            <th>Ime i Prezime</th>
                            <th>Email</th>
                            <th>Tip</th>
                            <th>Status</th>
                            <th>Akcije</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.ime} {user.prezime}</td>
                                <td>{user.email}</td>
                                <td>{user.userType}</td>
                                <td>{user.active ? 'Aktivan' : 'Neaktivan'}</td>
                                <td className="actions">
                                    <button className="btn-edit" onClick={() => handleEdit(user)}>Izmeni</button>
                                    <button onClick={() => handleToggleStatus(user)} className={user.active ? 'btn-delete' : ''}>
                                        {user.active ? 'Deaktiviraj' : 'Aktiviraj'}
                                    </button>
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

export default AdminUsersPage;