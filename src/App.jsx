// src/App.jsx

import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import EventDetailsPage from './pages/EventDetailsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SearchPage from './pages/SearchPage'; // Nova stranica za pretragu

// Stranice koje ćemo sada kreirati
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import EventsPage from './pages/EventsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import Navbar from "./components/Navbar.jsx"; // Dodajemo i Navbar
import './App.css';
import TagEventsPage from "./pages/TagEventsPage.jsx";
import CategoryEventsPage from "./pages/CategoryEventsPage.jsx";

function App() {
    return (
        <>
            <Navbar /> {/* Prikazuje meni na svim stranicama */}
            <main className="container">
                <Routes>
                    {/* Javne Rute */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/events/:id" element={<EventDetailsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/category/:id" element={<CategoryEventsPage />} /> {/* NOVA RUTA */}
                    <Route path="/tag/:id" element={<TagEventsPage />} />       {/* NOVA RUTA */}

                    {/* EMS Rute (zaštićene) */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'EVENT_CREATOR']}>
                            <DashboardPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/categories" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'EVENT_CREATOR']}>
                            <CategoriesPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/events-management" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'EVENT_CREATOR']}>
                            <EventsPage />
                        </ProtectedRoute>
                    } />
                    <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminUsersPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </main>
        </>
    );
}

export default App;