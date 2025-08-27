import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './Form.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await apiLogin(email, password);
            const token = response.data.token;

            if (token) {
                login(token);
                navigate('/dashboard');
            } else {
                setError('Došlo je do greške prilikom prijave.');
            }
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('Frontend issue.');
        }
    };

    return (
        <div className="form-container">
            <h2>Prijava na EMS</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Lozinka:</label>
                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit" style={{width: '100%'}}>Prijavi se</button>
                {error && <p className="form-error">{error}</p>}
            </form>
        </div>
    );
}

export default LoginPage;