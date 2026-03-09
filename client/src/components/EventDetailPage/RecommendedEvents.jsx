import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { shuffleArray } from "../../utils/shuffleUtils";
import RecommendedEventCard from "./RecommendedEventCard";
import "./RecommendedEvents.css";

const RecommendedEvents = ({ currentEventId, currentCategory }) => {
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoading] = useState(true);

    const isUpcomingEvent = (event) => {
        if (event.declaration) return true;
        if (event.month && event.date) {
            try {
                const eventDate = new Date(`${event.month}-${event.date}`);
                const currentDate = new Date();
                const thresholdDate = new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000);
                return eventDate > thresholdDate;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    useEffect(() => {
        const fetchRecommended = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/events`);
                let allEvents = res.data;

                // Filter out the current event and upcoming events
                let filtered = allEvents.filter(event => 
                    event._id !== currentEventId && !isUpcomingEvent(event)
                );

                // Try to find events in the same category first
                let sameCategory = filtered.filter(event =>
                    event.category?.toLowerCase() === currentCategory?.toLowerCase()
                );

                let recommendations = [];
                if (sameCategory.length >= 4) {
                    recommendations = shuffleArray(sameCategory).slice(0, 4);
                } else {
                    // If not enough in same category, mix with others
                    const otherEvents = filtered.filter(event =>
                        event.category?.toLowerCase() !== currentCategory?.toLowerCase()
                    );
                    recommendations = shuffleArray([...sameCategory, ...shuffleArray(otherEvents)]).slice(0, 4);
                }

                setRecommended(recommendations);
            } catch (err) {
                console.error("Error fetching recommended events:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommended();
    }, [currentEventId, currentCategory]);

    if (loading || recommended.length === 0) return null;

    return (
        <div className="recommended-section">
            <div className="recommended-header">
                <div className="recommended-title-wrapper">
                    <h2 className="recommended-title">Recommended Events</h2>
                    <div className="recommended-underline"></div>
                </div>
                <p className="recommended-subtitle">You might also be interested in these events</p>
            </div>
            <div className="recommended-grid">
                {recommended.map(event => {
                    let source = "top";
                    if (event.declaration) {
                        source = "upcoming";
                    } else if (event.category?.toLowerCase() === "comedy") {
                        source = "comedy";
                    } else if (event.month && event.date) {
                        try {
                            const eventDate = new Date(`${event.month}-${event.date}`);
                            const currentDate = new Date();
                            const oneMonthLater = new Date(currentDate.getTime() + 45 * 24 * 60 * 60 * 1000);
                            if (eventDate > oneMonthLater) source = "upcoming";
                        } catch (e) { }
                    }

                    return (
                        <RecommendedEventCard
                            key={event._id}
                            event={event}
                            category={source}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default RecommendedEvents;
