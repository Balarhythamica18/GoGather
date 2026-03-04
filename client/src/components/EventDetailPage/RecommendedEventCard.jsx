import React from "react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import "./RecommendedEvents.css";

const RecommendedEventCard = ({ event, category }) => {
    const formatPrice = (price) => {
        if (typeof price === "string" && price.toLowerCase() === "free") return "Free";
        return `Rs.${price}`;
    };

    const formatDate = (date, month) => {
        try {
            const dateObj = new Date(`${month}-${date}`);
            const day = String(dateObj.getDate()).padStart(2, "0");
            const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
            return `${day} ${monthName}`;
        } catch (e) {
            return `${date} ${month}`;
        }
    };

    // Determine the source for the URL if not provided
    const source = category || "top";

    return (
        <Link to={`/events/${source}/${event._id}`} className="rec-card">
            <div className="rec-card-image">
                <img src={getImageUrl(event.image)} alt={event.title} />
                <div className="rec-card-category">{event.category}</div>
            </div>
            <div className="rec-card-content">
                <div className="rec-card-top">
                    <span className="rec-card-date">
                        {formatDate(event.date, event.month)}
                    </span>
                    <span className="rec-card-price">{formatPrice(event.price)}</span>
                </div>
                <h3 className="rec-card-title">{event.title}</h3>
                <div className="rec-card-footer">
                    <span className="rec-card-location">📍 {event.location}</span>
                    <span className="rec-card-arrow">→</span>
                </div>
            </div>
        </Link>
    );
};

export default RecommendedEventCard;
