// src/services/api.js

import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// --- Auth Service ---
export const login = (email, password) => apiClient.post('/users/login', { email, password });

// --- Event Service ---
export const getAllEvents = () => apiClient.get('/events');
export const getEventById = (id) => apiClient.get(`/events/${id}`);
export const searchEvents = (query) => apiClient.get(`/events/search?query=${query}`);
export const createEvent = (eventData) => apiClient.post('/events', eventData);
export const updateEvent = (id, eventData) => apiClient.put(`/events/${id}`, eventData);
export const deleteEvent = (id) => apiClient.delete(`/events/${id}`);

// --- Category Service ---
export const getAllCategories = () => apiClient.get('/categories');
export const createCategory = (categoryData) => apiClient.post('/categories', categoryData);
export const updateCategory = (id, categoryData) => apiClient.put(`/categories/${id}`, categoryData);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);

// --- Comment Service ---
export const getCommentsForEvent = (eventId) => apiClient.get(`/events/${eventId}/comments`);
export const addComment = (eventId, commentData) => apiClient.post(`/events/${eventId}/comments`, commentData);

// --- User Service (Admin) ---
export const getAllUsers = () => apiClient.get('/users');
export const createUser = (userData) => apiClient.post('/users', userData);
// NAPOMENA: Backendu nedostaju sledeća dva endpointa, ovo je priprema za kad se dodaju.
export const updateUser = (id, userData) => apiClient.put(`/users/${id}`, userData);
export const toggleUserStatus = (id, status) => apiClient.put(`/users/${id}/status`, { active: status });

// --- Tag Service ---
export const getAllTags = () => apiClient.get('/tags');