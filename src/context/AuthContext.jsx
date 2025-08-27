import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                setUser(decodedUser);
                // eslint-disable-next-line no-unused-vars
            } catch (error) {
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = useCallback((token) => {
        try {
            localStorage.setItem('token', token);
            const decodedUser = jwtDecode(token);
            setUser(decodedUser);
        } catch(error) {
            console.error("Failed to decode token", error);
            setUser(null);
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}