import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Save,
    Calendar,
    MapPin,
    Clock,
    Tag,
    Info,
    Image as ImageIcon,
    User as UserIcon,
    Mail,
    Phone,
    Trash2,
    CheckCircle
} from "lucide-react";

const AddEvent = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState({
        date: "",
        time: "",
        title: "",
        location: "",
        address: "",
        category: "",
        customCategory: "",
        price: "",
        description: "",
        aboutEvent: "",
        keyHighlights: [],
        organizerName: "",
        organizerEmail: "",
        organizerPhone: "",
        mapLink: "",
        capacity: "",
        sessions: [], // [{ title, startTime, endTime }]
        refundPolicy: "",
        refundTiers: [], // [{ hoursBefore, refundPercentage }]
        instructions: "",
        brochure: "",
    });

    const [sessionInput, setSessionInput] = useState({ title: "", startTime: "", endTime: "" });
    const [tierInput, setTierInput] = useState({ hoursBefore: "", refundPercentage: "" });
    const [highlightInput, setHighlightInput] = useState("");

    const [image, setImage] = useState(null);
    const [brochure, setBrochure] = useState(null);
    const [preview, setPreview] = useState(null);
    const [brochureName, setBrochureName] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [modalType, setModalType] = useState("create"); // "create" or "update"

    useEffect(() => {
        if (id) {
            const load = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/events/${id}`);
                    const ev = res.data;

                    let isoDate = "";
                    if (ev.month && ev.date) {
                        isoDate = `${ev.month}-${String(ev.date).padStart(2, "0")}`;
                    }

                    setForm({
                        date: isoDate,
                        time: ev.time || "",
                        title: ev.title || "",
                        location: ev.location || "",
                        address: ev.address || "",
                        category: ev.category || "",
                        customCategory: "",
                        price: ev.price || "",
                        description: ev.description || "",
                        aboutEvent: ev.aboutEvent || "",
                        keyHighlights: ev.keyHighlights || [],
                        image: ev.image || "",
                        organizerName: ev.organizerDetails?.name || "",
                        organizerEmail: ev.organizerDetails?.contactEmail || "",
                        organizerPhone: ev.organizerDetails?.contactPhone || "",
                        mapLink: ev.mapLink || "",
                        availableSeats: ev.availableSeats || 0,
                        capacity: ev.capacity || "",
                        sessions: ev.sessions || [],
                        refundPolicy: ev.refundPolicy || "",
                        refundTiers: ev.refundTiers || [],
                        instructions: ev.instructions || "",
                        brochure: ev.brochure || "",
                    });
                    setImage(null);
                    setBrochure(null);
                    if (ev.image) setPreview(getImageUrl(ev.image));
                    if (ev.brochure) setBrochureName("Existing Brochure");
                } catch (err) {
                    console.error("Error loading event for edit:", err);
                }
            };
            load();
        } else {
            // For new event, pre-fill with organizer profile info
            const fetchProfile = async () => {
                const token = localStorage.getItem("token");
                if (token) {
                    try {
                        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setForm(prev => ({
                            ...prev,
                            organizerName: res.data.name || "",
                            organizerEmail: res.data.email || ""
                        }));
                    } catch (err) {
                        console.error("Error fetching profile for pre-fill:", err);
                    }
                }
            };
            fetchProfile();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleBrochureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBrochure(file);
            setBrochureName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent past dates (additional validation as fallback)
        const selectedDate = new Date(form.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            alert("You cannot create/update an event with a past date.");
            return;
        }

        setLoading(true);
        const formData = new FormData();

        const finalCategory = form.category === "Other" ? form.customCategory : form.category;

        Object.keys(form).forEach((key) => {
            if (key === "keyHighlights" || key === "customCategory" || key === "image" || key === "sessions" || key === "refundTiers") return;
            formData.append(key, form[key]);
        });

        formData.set("category", finalCategory);
        (form.keyHighlights || []).forEach((highlight) => formData.append("keyHighlights", highlight));

        // Add as JSON strings
        formData.append("sessions", JSON.stringify(form.sessions));
        formData.append("refundTiers", JSON.stringify(form.refundTiers));

        if (image) {
            formData.append("image", image);
        } else if (form.image) {
            formData.set("image", form.image);
        }

        if (brochure) {
            formData.append("brochure", brochure);
        } else if (form.brochure) {
            formData.set("brochure", form.brochure);
        }

        // Form validation
        const requiredFields = ["title", "date", "time", "location", "address", "category", "description", "organizerName", "capacity"];
        const missingFields = requiredFields.filter(field => !form[field]);

        if (missingFields.length > 0) {
            alert(`Please fill in all required fields: ${missingFields.join(", ")}`);
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const config = {
                headers: { "Content-Type": "multipart/form-data", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            };

            if (id) {
                await axios.put(`${API_BASE_URL}/api/events/${id}`, formData, config);
                setModalType("update");
            } else {
                await axios.post(`${API_BASE_URL}/api/events`, formData, config);
                setModalType("create");
            }
            setShowSuccess(true);
        } catch (err) {
            console.error("Save Error:", err);
            let errorMessage = err.response?.data?.message || err.message;

            // If it's a 500 and we have a response but no message, it might be a server crash
            if (err.response?.status === 500 && !err.response?.data?.message) {
                errorMessage = "Internal Server Error. Please check if the image size is too large or try again later.";
            }

            alert("Error saving event: " + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page} className="add-event-page">
            <style>{`
                .add-event-page {
                    --container-padding: 40px 20px;
                }
                @media (max-width: 1024px) {
                    .add-event-form-layout {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .add-event-right-column {
                        position: static !important;
                    }
                }
                @media (max-width: 768px) {
                    .add-event-page {
                        padding: 24px 12px !important;
                    }
                    .add-event-title {
                        font-size: 26px !important;
                        margin-bottom: 4px !important;
                    }
                    .add-event-grid-2 {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                    .add-event-card {
                        padding: 20px 16px !important;
                        border-radius: 12px !important;
                    }
                    .add-event-header {
                        margin-bottom: 24px !important;
                    }
                }

                @media (max-width: 480px) {
                    .add-event-page {
                        padding: 16px 10px !important;
                    }
                    .preview-wrapper, .upload-placeholder {
                        height: 200px !important;
                    }
                }

                /* Professional Scrollbar - subtle but there */
                ::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
            <div style={styles.container}>
                {/* Header Section */}
                <header style={styles.header} className="add-event-header">
                    <button type="button" style={styles.backLink} onClick={() => navigate("/dashboard")}>
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                    <h1 style={styles.title} className="add-event-title">{id ? "Edit Event" : "Create New Event"}</h1>
                    <p style={styles.subtitle}>Fill in the details below to list your event on GoGather.</p>
                </header>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formLayout} className="add-event-form-layout">
                        {/* Left Column - Main Details */}
                        <div style={styles.leftColumn}>
                            <div style={styles.card} className="add-event-card">
                                <h3 style={styles.cardTitle}>Basic Information</h3>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Event Title</label>
                                    <input
                                        name="title"
                                        placeholder="e.g. Summer Music Festival 2024"
                                        onChange={handleChange}
                                        required
                                        style={styles.input}
                                        value={form.title}
                                    />
                                </div>

                                <div style={styles.grid2} className="add-event-grid-2">
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Category</label>
                                        <div style={styles.selectWrapper}>
                                            <Tag size={16} color="#94a3b8" style={styles.selectIcon} />
                                            <select name="category" onChange={handleChange} required style={styles.select} value={form.category}>
                                                <option value="">Select Category</option>
                                                <option>Food</option>
                                                <option>Rawstories</option>
                                                <option>TheatreDrama</option>
                                                <option>Comedy</option>
                                                <option>Sports</option>
                                                <option>Art</option>
                                                <option>Concert</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    {form.category === "Other" && (
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Custom Category</label>
                                            <input name="customCategory" placeholder="Enter Category" onChange={handleChange} required style={styles.input} value={form.customCategory} />
                                        </div>
                                    )}
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Price (optional)</label>
                                        <div style={styles.inputWithIcon}>
                                            <span style={styles.currencyPrefix}>₹</span>
                                            <input name="price" placeholder="0.00" onChange={handleChange} style={styles.inputIcon} value={form.price} />
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Brief Description</label>
                                    <textarea
                                        name="description"
                                        placeholder="Short summary for event cards..."
                                        onChange={handleChange}
                                        style={styles.textareaCompact}
                                        value={form.description}
                                        required
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>About Event (Detailed)</label>
                                    <textarea
                                        name="aboutEvent"
                                        placeholder="Full details about the event, what to expect, etc..."
                                        onChange={handleChange}
                                        style={styles.textareaCompact}
                                        value={form.aboutEvent}
                                        rows={5}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Key Highlights</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            placeholder="e.g. VIP Seating, Free Parking..."
                                            style={styles.input}
                                            value={highlightInput}
                                            onChange={(e) => setHighlightInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (highlightInput.trim()) {
                                                        setForm({ ...form, keyHighlights: [...form.keyHighlights, highlightInput.trim()] });
                                                        setHighlightInput("");
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            style={styles.addSessionBtn}
                                            onClick={() => {
                                                if (highlightInput.trim()) {
                                                    setForm({ ...form, keyHighlights: [...form.keyHighlights, highlightInput.trim()] });
                                                    setHighlightInput("");
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {form.keyHighlights.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                            {form.keyHighlights.map((h, idx) => (
                                                <div key={idx} style={styles.highlightTag}>
                                                    {h}
                                                    <Trash2
                                                        size={12}
                                                        style={{ cursor: 'pointer', marginLeft: '6px' }}
                                                        onClick={() => setForm({ ...form, keyHighlights: form.keyHighlights.filter((_, i) => i !== idx) })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={styles.card} className="add-event-card">
                                <h3 style={styles.cardTitle}>Location & Time</h3>
                                <div style={styles.grid2} className="add-event-grid-2">
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Date</label>
                                        <div style={styles.inputWithIcon}>
                                            <Calendar size={18} color="#94a3b8" style={styles.iconPos} />
                                            <input
                                                type="date"
                                                name="date"
                                                onChange={handleChange}
                                                required
                                                style={styles.inputIcon}
                                                value={form.date}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Time</label>
                                        <div style={styles.inputWithIcon}>
                                            <Clock size={18} color="#94a3b8" style={styles.iconPos} />
                                            <input type="time" name="time" onChange={handleChange} required style={styles.inputIcon} value={form.time} />
                                        </div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Select start time (24h format internally)</p>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>City/Location</label>
                                        <div style={styles.inputWithIcon}>
                                            <MapPin size={18} color="#94a3b8" style={styles.iconPos} />
                                            <input name="location" placeholder="City" onChange={handleChange} required style={styles.inputIcon} value={form.location} />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Specific Venue/Address</label>
                                        <input name="address" placeholder="Venue Address" onChange={handleChange} required style={styles.input} value={form.address} />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.card} className="add-event-card">
                                <h3 style={styles.cardTitle}>Professional Details</h3>
                                <div style={styles.grid2} className="add-event-grid-2">
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Ticket Capacity <span style={{ color: '#ef4444' }}>*</span></label>
                                        <input
                                            type="number"
                                            name="capacity"
                                            placeholder="Max attendees (e.g. 500)"
                                            onChange={handleChange}
                                            required
                                            min="1"
                                            style={styles.input}
                                            value={form.capacity}
                                        />
                                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Used to generate seat layout and limit bookings.</p>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Google Maps Link</label>
                                        <input
                                            name="mapLink"
                                            placeholder="https://maps.google.com/..."
                                            onChange={handleChange}
                                            style={styles.input}
                                            value={form.mapLink}
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Event Sessions (Optional)</label>
                                    <div style={styles.sessionGrid}>
                                        <input
                                            placeholder="Session Title"
                                            style={styles.input}
                                            value={sessionInput.title}
                                            onChange={(e) => setSessionInput({ ...sessionInput, title: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            style={styles.input}
                                            value={sessionInput.startTime}
                                            onChange={(e) => setSessionInput({ ...sessionInput, startTime: e.target.value })}
                                        />
                                        <input
                                            type="time"
                                            style={styles.input}
                                            value={sessionInput.endTime}
                                            onChange={(e) => setSessionInput({ ...sessionInput, endTime: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            style={styles.addSessionBtn}
                                            onClick={() => {
                                                if (sessionInput.title && sessionInput.startTime) {
                                                    setForm({ ...form, sessions: [...form.sessions, sessionInput] });
                                                    setSessionInput({ title: "", startTime: "", endTime: "" });
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {form.sessions.length > 0 && (
                                        <div style={styles.sessionList}>
                                            {form.sessions.map((s, idx) => (
                                                <div key={idx} style={styles.sessionItem}>
                                                    <span><strong>{s.title}</strong> ({s.startTime} - {s.endTime})</span>
                                                    <button
                                                        type="button"
                                                        style={styles.removeSessionBtn}
                                                        onClick={() => setForm({ ...form, sessions: form.sessions.filter((_, i) => i !== idx) })}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Refund Policy (Text Description)</label>
                                    <textarea
                                        name="refundPolicy"
                                        placeholder="e.g. Before 48 hours '50% Refund', Before 24 hours 25% Refund..."
                                        onChange={handleChange}
                                        style={styles.textareaCompact}
                                        value={form.refundPolicy}
                                        rows={2}
                                    />
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Briefly describe your policy for display to attendees.</p>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Special Instructions for Attendees</label>
                                    <textarea
                                        name="instructions"
                                        placeholder="e.g. Please bring valid ID, arrive 30 mins early..."
                                        onChange={handleChange}
                                        style={styles.textareaCompact}
                                        value={form.instructions}
                                        rows={3}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Applied Refund Tiers (System Logic)</label>
                                    <div style={styles.tierGrid}>
                                        <div style={styles.tierInputWrapper}>
                                            <span style={styles.tierLabel}>Before (hours)</span>
                                            <input
                                                type="number"
                                                placeholder="48"
                                                style={styles.input}
                                                value={tierInput.hoursBefore}
                                                onChange={(e) => setTierInput({ ...tierInput, hoursBefore: e.target.value })}
                                            />
                                        </div>
                                        <div style={styles.tierInputWrapper}>
                                            <span style={styles.tierLabel}>Refund %</span>
                                            <input
                                                type="number"
                                                placeholder="50"
                                                style={styles.input}
                                                value={tierInput.refundPercentage}
                                                onChange={(e) => setTierInput({ ...tierInput, refundPercentage: e.target.value })}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            style={styles.addTierBtn}
                                            onClick={() => {
                                                if (tierInput.hoursBefore !== "" && tierInput.refundPercentage !== "") {
                                                    setForm({
                                                        ...form, refundTiers: [...form.refundTiers, {
                                                            hoursBefore: parseInt(tierInput.hoursBefore),
                                                            refundPercentage: parseInt(tierInput.refundPercentage)
                                                        }].sort((a, b) => b.hoursBefore - a.hoursBefore)
                                                    });
                                                    setTierInput({ hoursBefore: "", refundPercentage: "" });
                                                }
                                            }}
                                        >
                                            Add Tier
                                        </button>
                                    </div>

                                    {form.refundTiers.length > 0 && (
                                        <div style={styles.tierList}>
                                            {form.refundTiers.map((t, idx) => (
                                                <div key={idx} style={styles.tierItem}>
                                                    <span><strong>{t.hoursBefore}h+</strong> before event → <strong>{t.refundPercentage}%</strong> Refund</span>
                                                    <button
                                                        type="button"
                                                        style={styles.removeSessionBtn}
                                                        onClick={() => setForm({ ...form, refundTiers: form.refundTiers.filter((_, i) => i !== idx) })}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                                        <Info size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                        System uses these tiers to automatically calculate refunds. Example: 48h before = 50% refund.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Media & Organizer */}
                        <div style={styles.rightColumn} className="add-event-right-column">
                            <div style={styles.card} className="add-event-card">
                                <h3 style={styles.cardTitle}>Event Media</h3>
                                <div style={styles.imageUploadArea}>
                                    {(preview || form.image) ? (
                                        <div style={styles.previewWrapper}>
                                            <img src={preview || getImageUrl(form.image)} alt="Preview" style={styles.previewImage} />
                                            <button
                                                type="button"
                                                style={styles.removeImageBtn}
                                                onClick={() => { setImage(null); setPreview(null); }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={styles.uploadPlaceholder}>
                                            <ImageIcon size={40} color="#cbd5e1" />
                                            <p>Click to upload event cover</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={styles.fileInput}
                                        id="event-image"
                                    />
                                    <label htmlFor="event-image" style={styles.uploadBtn}>
                                        {(preview || form.image) ? "Change Image" : "Select Image"}
                                    </label>
                                </div>
                                <p style={styles.helpText}>Recommended: 1200 x 600px, max 5MB</p>

                                <div style={{ marginTop: '24px' }}>
                                    <label style={styles.label}>Event Brochure (Optional)</label>
                                    <div style={styles.brochureUpload}>
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            id="event-brochure"
                                            onChange={handleBrochureChange}
                                            style={{ display: 'none' }}
                                        />
                                        <label htmlFor="event-brochure" style={styles.brochureBtn}>
                                            <Info size={16} />
                                            {brochureName || "Upload PDF/Image Brochure"}
                                        </label>
                                        {brochureName && (
                                            <button
                                                type="button"
                                                style={styles.removeBrochure}
                                                onClick={() => { setBrochure(null); setBrochureName(""); }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={styles.card}>
                                <h3 style={styles.cardTitle}>Organizer Profile</h3>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Display Name</label>
                                    <div style={styles.inputWithIcon}>
                                        <UserIcon size={18} color="#94a3b8" style={styles.iconPos} />
                                        <input name="organizerName" placeholder="Organization Name" onChange={handleChange} required style={styles.inputIcon} value={form.organizerName} />
                                    </div>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Contact Email</label>
                                    <div style={styles.inputWithIcon}>
                                        <Mail size={18} color="#94a3b8" style={styles.iconPos} />
                                        <input name="organizerEmail" placeholder="email@example.com" onChange={handleChange} style={styles.inputIcon} value={form.organizerEmail} />
                                    </div>
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Contact Phone</label>
                                    <div style={styles.inputWithIcon}>
                                        <Phone size={18} color="#94a3b8" style={styles.iconPos} />
                                        <input name="organizerPhone" placeholder="+91 000 000 0000" onChange={handleChange} style={styles.inputIcon} value={form.organizerPhone} />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                style={loading ? styles.submitBtnDisabled : styles.submitBtn}
                                disabled={loading}
                            >
                                {loading ? "Saving..." : (id ? "Update Event" : "Publish Event")}
                                <Save size={18} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.successIconWrapper}>
                            <CheckCircle size={48} color="#10b981" />
                        </div>
                        <h2 style={styles.modalTitle}>
                            {modalType === "create" ? "Event Published!" : "Event Updated!"}
                        </h2>
                        <p style={styles.modalMessage}>
                            {modalType === "create"
                                ? "Your event has been submitted successfully and is now waiting for admin approval."
                                : "Your event details have been successfully updated."}
                        </p>
                        <button
                            style={styles.modalActionBtn}
                            onClick={() => navigate("/dashboard")}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "40px 20px",
        fontFamily: '"Inter", -apple-system, sans-serif',
    },
    container: {
        maxWidth: "1100px",
        margin: "0 auto",
    },
    header: {
        marginBottom: "32px",
    },
    backLink: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "none",
        border: "none",
        color: "#64748b",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        padding: "0",
        marginBottom: "20px",
    },
    title: {
        fontSize: "32px",
        fontWeight: "800",
        color: "#1e293b",
        margin: "0 0 8px 0",
        letterSpacing: "-0.025em",
    },
    subtitle: {
        fontSize: "16px",
        color: "#64748b",
        margin: 0,
    },
    formLayout: {
        display: "grid",
        gridTemplateColumns: "1fr 340px",
        gap: "32px",
        alignItems: "start",
    },
    leftColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    rightColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        position: "sticky",
        top: "40px",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    },
    cardTitle: {
        fontSize: "18px",
        fontWeight: "600",
        color: "#1e293b",
        margin: "0 0 20px 0",
        paddingBottom: "12px",
        borderBottom: "1px solid #f1f5f9",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "20px",
    },
    label: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#475569",
    },
    input: {
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        color: "#1e293b",
        outline: "none",
        transition: "border-color 0.2s ease",
    },
    inputWithIcon: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    iconPos: {
        position: "absolute",
        left: "12px",
    },
    inputIcon: {
        padding: "12px 16px 12px 40px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        color: "#1e293b",
        outline: "none",
        width: "100%",
    },
    currencyPrefix: {
        position: "absolute",
        left: "16px",
        color: "#94a3b8",
        fontWeight: "600",
    },
    grid2: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
    },
    sessionGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 100px 100px 80px",
        gap: "12px",
        marginBottom: "12px",
    },
    addSessionBtn: {
        padding: "10px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#0b0f5b",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
    },
    sessionList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "12px",
    },
    highlightTag: {
        backgroundColor: "#f1f5f9",
        color: "#475569",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        display: "flex",
        alignItems: "center",
        border: "1px solid #e2e8f0",
    },
    brochureUpload: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginTop: "8px",
    },
    brochureBtn: {
        flex: 1,
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px dashed #cbd5e1",
        backgroundColor: "#f8fafc",
        color: "#64748b",
        fontSize: "14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "all 0.2s",
    },
    removeBrochure: {
        padding: "10px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: "#fee2e2",
        color: "#ef4444",
        cursor: "pointer",
    },
    sessionItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 16px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        fontSize: "14px",
    },
    tierGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 100px",
        gap: "12px",
        alignItems: "end",
        marginBottom: "12px",
    },
    tierInputWrapper: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    tierLabel: {
        fontSize: "11px",
        color: "#94a3b8",
        fontWeight: "600",
        textTransform: "uppercase",
    },
    addTierBtn: {
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#0b0f5b",
        color: "#fff",
        fontWeight: "600",
        cursor: "pointer",
        fontSize: "13px",
    },
    tierList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "12px",
    },
    tierItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "#f0f9ff",
        borderLeft: "4px solid #0ea5e9",
        borderRadius: "8px",
        fontSize: "14px",
        color: "#0369a1",
    },
    removeSessionBtn: {
        background: "none",
        border: "none",
        color: "#ef4444",
        cursor: "pointer",
        padding: "4px",
    },
    selectWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center",
    },
    selectIcon: {
        position: "absolute",
        left: "12px",
        pointerEvents: "none",
    },
    selectStandalone: {
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        color: "#1e293b",
        backgroundColor: "#fff",
        outline: "none",
    },
    select: {
        padding: "12px 16px 12px 36px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        color: "#1e293b",
        backgroundColor: "#fff",
        width: "100%",
        outline: "none",
    },
    textareaCompact: {
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        minHeight: "80px",
        resize: "vertical",
        outline: "none",
    },
    textareaLarge: {
        padding: "12px 16px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        fontSize: "15px",
        minHeight: "180px",
        resize: "vertical",
        outline: "none",
    },
    imageUploadArea: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        alignItems: "center",
    },
    uploadPlaceholder: {
        width: "100%",
        height: "160px",
        border: "2px dashed #e2e8f0",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        color: "#94a3b8",
        fontSize: "14px",
        cursor: "pointer",
    },
    previewWrapper: {
        position: "relative",
        width: "100%",
        height: "160px",
        borderRadius: "12px",
        overflow: "hidden",
    },
    previewImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },
    removeImageBtn: {
        position: "absolute",
        top: "8px",
        right: "8px",
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        backgroundColor: "rgba(244, 63, 94, 0.9)",
        color: "#fff",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    fileInput: {
        display: "none",
    },
    uploadBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#fff",
        color: "#1e293b",
        fontSize: "14px",
        fontWeight: "600",
        textAlign: "center",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
    },
    helpText: {
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "8px",
        textAlign: "center",
    },
    submitBtn: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#0b0f5b",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 10px 15px -3px rgba(11, 15, 91, 0.3)",
        background: "linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%)",
    },
    submitBtnDisabled: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "16px",
        borderRadius: "12px",
        border: "none",
        backgroundColor: "#94a3b8",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "not-allowed",
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '40px',
        width: '90%',
        maxWidth: '440px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'modalSlideUp 0.3s ease-out',
    },
    successIconWrapper: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
    },
    modalTitle: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: '12px',
        letterSpacing: '-0.02em',
    },
    modalMessage: {
        fontSize: '16px',
        color: '#64748b',
        lineHeight: '1.6',
        marginBottom: '32px',
    },
    modalActionBtn: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#0b0f5b',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: "linear-gradient(180deg, #0b0f5b 0%, #0a0d4a 100%)",
        boxShadow: '0 10px 15px -3px rgba(11, 15, 91, 0.3)',
    },
};

export default AddEvent;
