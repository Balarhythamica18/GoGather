import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getImageUrl } from "../../utils/imageUtils";
import { useNavigate, useParams } from "react-router-dom";
import { addressOptions, getAddressesByLocation } from "../../data/addressOptions";
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
    });

    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
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
                    });
                    setImage(null);
                    if (ev.image) setPreview(ev.image);
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

    const handleHighlightsChange = (e) => {
        setForm((f) => ({ ...f, keyHighlights: e.target.value.split(",").map(h => h.trim()) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent past dates
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
            if (key === "keyHighlights" || key === "customCategory" || key === "image") return;
            formData.append(key, form[key]);
        });

        formData.set("category", finalCategory);
        (form.keyHighlights || []).forEach((highlight) => formData.append("keyHighlights", highlight));

        if (image) {
            formData.append("image", image);
        } else if (form.image) {
            // Keep existing image if no new one selected
            formData.set("image", form.image);
        }

        // Form validation
        const requiredFields = ["title", "date", "time", "location", "address", "category", "description", "organizerName"];
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
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header Section */}
                <header style={styles.header}>
                    <button type="button" style={styles.backLink} onClick={() => navigate("/dashboard")}>
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                    <h1 style={styles.title}>{id ? "Edit Event" : "Create New Event"}</h1>
                    <p style={styles.subtitle}>Fill in the details below to list your event on GoGather.</p>
                </header>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formLayout}>
                        {/* Left Column - Main Details */}
                        <div style={styles.leftColumn}>
                            <div style={styles.card}>
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

                                <div style={styles.grid2}>
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
                                    />
                                </div>
                            </div>

                            <div style={styles.card}>
                                <h3 style={styles.cardTitle}>Location & Time</h3>
                                <div style={styles.grid2}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Date</label>
                                        <div style={styles.inputWithIcon}>
                                            <Calendar size={18} color="#94a3b8" style={styles.iconPos} />
                                            <input type="date" name="date" onChange={handleChange} required style={styles.inputIcon} value={form.date} />
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
                                        {form.location && getAddressesByLocation(form.location).length > 0 ? (
                                            <select name="address" onChange={handleChange} required style={styles.selectStandalone} value={form.address}>
                                                <option value="">Select Venue</option>
                                                {getAddressesByLocation(form.location).map((addr, idx) => (
                                                    <option key={idx} value={addr}>{addr}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input name="address" placeholder="Venue Address" onChange={handleChange} required style={styles.input} value={form.address} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={styles.card}>
                                <h3 style={styles.cardTitle}>Detailed Information</h3>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>About the Event</label>
                                    <textarea
                                        name="aboutEvent"
                                        placeholder="Tell your attendees all they need to know..."
                                        onChange={handleChange}
                                        style={styles.textareaLarge}
                                        value={form.aboutEvent}
                                    />
                                </div>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Key Highlights (comma separated)</label>
                                    <input
                                        name="keyHighlights"
                                        placeholder="Live Music, Workshops, Drinks included..."
                                        onChange={handleHighlightsChange}
                                        style={styles.input}
                                        value={Array.isArray(form.keyHighlights) ? form.keyHighlights.join(', ') : form.keyHighlights}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Media & Organizer */}
                        <div style={styles.rightColumn}>
                            <div style={styles.card}>
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
        backgroundColor: "#ff007a",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 10px 15px -3px rgba(255, 0, 122, 0.3)",
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
        backgroundColor: '#ff007a',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 10px 15px -3px rgba(255, 0, 122, 0.3)',
    },
};

export default AddEvent;
