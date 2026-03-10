import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { shuffleArray } from "../../utils/shuffleUtils";
import RecommendedEventCard from "./RecommendedEventCard";
import Skeleton from "../ui/Skeleton";
import "./RecommendedEvents.css";

const RecommendedEvents = ({ currentEventId, currentCategory }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const isUpcomingEvent = (event) => {
        if (event.declaration) return true;
        if (event.month && event.date) {
            try {
                // Formatting date carefully: "2026-04-25" style or "April-25"
                const dateStr = event.month.includes('-') ? `${event.month}-${String(event.date).padStart(2, '0')}` : `${event.month} ${event.date}, 2026`;
                const eventDate = new Date(dateStr);
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

                setEvents(recommendations);
            } catch (err) {
                console.error("Error fetching recommended events:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommended();
    }, [currentEventId, currentCategory]);

    if (!loading && events.length === 0) return null;

    return (
        <div className="recommended-section">
            <div className="recommended-header">
                <div className="recommended-title-wrapper">
                    <h2 className="recommended-title">Recommended Events</h2>
                    <div className="recommended-underline"></div>
                </div>
                <p className="recommended-subtitle">You might also be interested in these events</p>
            </div>

            <div className="rec-grid">
                {loading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="rec-card" style={{ cursor: 'default' }}>
                            <div className="rec-card-image">
                                <Skeleton height="100%" borderRadius="0px" />
                            </div>
                            <div className="rec-card-content">
                                <div className="rec-card-top">
                                    <Skeleton height="14px" width="40%" />
                                    <Skeleton height="14px" width="30%" />
                                </div>
                                <Skeleton height="20px" width="85%" style={{ margin: '12px 0' }} />
                                <div className="rec-card-footer">
                                    <Skeleton height="14px" width="50%" />
                                    <Skeleton height="18px" width="18px" borderRadius="4px" />
                                </div>
                            </div>
                        </div>
                    ))
                    : events.map(ev => {
                        let source = "top";
                        if (ev.category?.toLowerCase() === "comedy") {
                            source = "comedy";
                        }
                        return (
                            <RecommendedEventCard key={ev._id} event={ev} category={source} />
                        );
                    })
                }
            </div>
        </div>
    );
};

export default RecommendedEvents;
