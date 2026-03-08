import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { X, CheckCircle, AlertCircle, Clock, Info } from "lucide-react";
import toast from "react-hot-toast";

const QRScannerModal = ({ event, onClose }) => {
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanError);

        function onScanSuccess(decodedText) {
            try {
                const data = JSON.parse(decodedText);
                if (data.id) {
                    handleVerification(data.id);
                    scanner.clear();
                    setScanning(false);
                } else {
                    toast.error("Invalid QR Code Format");
                }
            } catch (err) {
                // If not JSON, maybe it's just the ID
                if (decodedText.length === 24) {
                    handleVerification(decodedText);
                    scanner.clear();
                    setScanning(false);
                } else {
                    toast.error("Unrecognized QR Code");
                }
            }
        }

        function onScanError(err) {
            // Silence common scanning errors
        }

        return () => {
            scanner.clear().catch(e => console.error("Scanner cleanup error", e));
        };
    }, []);

    const handleVerification = async (bookingId) => {
        setLoading(true);
        try {
            const res = await axios.patch(`${API_BASE_URL}/api/bookings/verify-entry`, { bookingId });
            setScanResult({
                success: true,
                message: res.data.message,
                details: res.data.details
            });
        } catch (err) {
            setScanResult({
                success: false,
                message: err.response?.data?.error || "Verification Failed",
                subMessage: err.response?.data?.message || "Please check the ticket details."
            });
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setScanning(true);
        window.location.reload(); // Quick fix to re-mount scanner properly if needed, 
        // but better to just re-instantiate. However, html5-qrcode can be finicky with re-renders.
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Ticket Verification</h2>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.eventInfo}>
                        <Info size={16} />
                        <span>Validating for: <strong>{event.title}</strong></span>
                    </div>

                    {scanning && !scanResult ? (
                        <div style={styles.scannerContainer}>
                            <div id="reader" style={styles.reader}></div>
                            <p style={styles.hint}>Position the QR code within the frame to scan</p>
                        </div>
                    ) : (
                        <div style={styles.resultContainer}>
                            {loading ? (
                                <div style={styles.loadingState}>
                                    <div style={styles.spinner}></div>
                                    <p>Verifying Ticket...</p>
                                </div>
                            ) : scanResult.success ? (
                                <div style={styles.successState}>
                                    <div style={styles.iconWrapperSuccess}>
                                        <CheckCircle size={64} color="#10b981" />
                                    </div>
                                    <h3 style={styles.resultTitle}>{scanResult.message}</h3>
                                    <div style={styles.detailsCard}>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Attendee:</span>
                                            <span style={styles.detailValue}>{scanResult.details?.userName}</span>
                                        </div>
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Seats/Tickets:</span>
                                            <span style={styles.detailValue}>{scanResult.details?.seats}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => window.location.reload()} style={styles.nextBtn}>
                                        Scan Next Ticket
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.errorState}>
                                    <div style={styles.iconWrapperError}>
                                        {scanResult.message?.includes("⏳") ? (
                                            <Clock size={64} color="#d97706" />
                                        ) : (
                                            <AlertCircle size={64} color="#ef4444" />
                                        )}
                                    </div>
                                    <h3 style={styles.resultTitle}>{scanResult.message}</h3>
                                    <p style={styles.errorSub}>{scanResult.subMessage}</p>
                                    <button onClick={() => window.location.reload()} style={styles.retryBtn}>
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
        padding: '20px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#1e293b',
        margin: 0,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
    },
    content: {
        padding: '24px',
    },
    eventInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        fontSize: '13px',
        color: '#64748b',
        marginBottom: '24px',
    },
    scannerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    reader: {
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: 'none !important',
    },
    hint: {
        marginTop: '16px',
        fontSize: '14px',
        color: '#94a3b8',
        textAlign: 'center',
    },
    resultContainer: {
        textAlign: 'center',
        padding: '20px 0',
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f1f5f9',
        borderTop: '4px solid #0b0f5b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    successState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    iconWrapperSuccess: {
        marginBottom: '20px',
        animation: 'scaleUp 0.3s ease-out',
    },
    resultTitle: {
        fontSize: '22px',
        fontWeight: '800',
        color: '#1e293b',
        margin: '0 0 16px 0',
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#f1f5f9',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '24px',
        textAlign: 'left',
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
    },
    detailLabel: {
        fontSize: '13px',
        color: '#64748b',
    },
    detailValue: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1e293b',
    },
    nextBtn: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#10b981',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
    },
    errorState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    iconWrapperError: {
        marginBottom: '20px',
        animation: 'shake 0.5s ease-in-out',
    },
    errorSub: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '24px',
    },
    retryBtn: {
        width: '100%',
        padding: '14px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#ef4444',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
    },
};

export default QRScannerModal;
