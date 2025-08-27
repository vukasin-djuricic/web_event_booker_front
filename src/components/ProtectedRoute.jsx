import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Korisnik nema potrebnu ulogu, preusmeri ga na dashboard ili početnu
        return <Navigate to="/dashboard" />;
    }

    return children;
}

export default ProtectedRoute;