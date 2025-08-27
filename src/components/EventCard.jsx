// src/components/EventCard.jsx

import { Link } from 'react-router-dom';
import './EventCard.css'; // Uvezite novi CSS

function EventCard({ event }) {
    return (
        <div className="card">
            <h2><Link to={`/events/${event.id}`}>{event.naslov}</Link></h2>
            <p>{event.opis.substring(0, 150)}...</p>
            <div className="card-footer">
                <span>Kategorija: {event.categoryName}</span><br/>
                <span>Datum: {new Date(event.datumOdrzavanja).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

export default EventCard;