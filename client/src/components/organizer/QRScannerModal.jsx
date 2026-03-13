import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { X, CheckCircle, AlertCircle, Clock, Info, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

const QRScannerModal = ({ event, onClose }) => {
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [scanKey, setScanKey] = useState(0);

    useEffect(() => {
        if (!scanning) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
            },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanError);

        function onScanSuccess(decodedText) {
            const rawText = decodedText.trim();

            // 1. Try treating it as a plain 24-char ID (New simplified format)
            if (rawText.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawText)) {
                handleVerification(rawText);
                scanner.clear();
                setScanning(false);
                return;
            }

            // 2. Fallback to JSON (Old format)
            try {
                const data = JSON.parse(rawText);
                if (data.id) {
                    handleVerification(data.id);
                    scanner.clear();
                    setScanning(false);
                } else {
                    toast.error("This doesn't look like a GoGather ticket 🎫");
                }
            } catch (err) {
                toast.error("Unrecognized QR Code. Please ensure it's a valid GoGather ticket.");
            }
        }

        function onScanError(err) {
            // Silence common scanning errors
        }

        return () => {
            scanner.clear().catch(e => console.error("Scanner cleanup error", e));
        };
    }, [scanKey, scanning]);

    const resetScanner = () => {
        setScanResult(null);
        setScanning(true);
        setScanKey(prev => prev + 1);
    };

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
                code: err.response?.data?.code || "UNKNOWN_ERROR",
                message: err.response?.data?.error || "Verification Failed",
                subMessage: err.response?.data?.message || err.response?.data?.error || "Please check the ticket details."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={24} color="#0b0f5b" />
                        <h2 style={styles.title}>Secure Verification</h2>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div style={styles.content}>
                    <div style={styles.eventInfo}>
                        <Info size={16} color="#0b0f5b" />
                        <span>Validating for: <strong>{event.title}</strong></span>
                    </div>

                    <div style={styles.timingInfo}>
                        <Clock size={20} color="#f59e0b" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={styles.timingLabel}>Access Window</span>
                            <span style={styles.timingValue}>Scanning starts 30 minutes before <strong>{event.time || "the event"}</strong></span>
                        </div>
                    </div>

                    {scanning && !scanResult ? (
                        <div style={styles.scannerContainer}>
                            <div id="reader" style={styles.reader}></div>
                            <div style={styles.hintContainer}>
                                <div style={styles.hintPulse}></div>
                                <p style={styles.hint}>Align the QR code within the frame to scan</p>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.resultContainer}>
                            {loading ? (
                                <div style={styles.loadingState}>
                                    <div style={styles.spinner}></div>
                                    <p style={styles.loadingText}>Verifying entry credentials...</p>
                                </div>
                            ) : scanResult.success ? (
                                <div style={styles.successState}>
                                    <div style={styles.iconWrapperSuccess}>
                                        <CheckCircle size={80} color="#0b0f5b" />
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
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Timestamp:</span>
                                            <span style={styles.detailValue}>{new Date().toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <button onClick={resetScanner} style={styles.nextBtn}>
                                        Scan Next Ticket
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.errorState}>
                                    <div style={styles.iconWrapperError}>
                                        {scanResult.code === "NOT_STARTED" ? (
                                            <Clock size={80} color="#f59e0b" />
                                        ) : scanResult.code === "ALREADY_SCANNED" ? (
                                            <AlertCircle size={80} color="#f59e0b" />
                                        ) : (
                                            <AlertCircle size={80} color="#ef4444" />
                                        )}
                                    </div>
                                    <h3 style={styles.resultTitle}>{scanResult.message}</h3>
                                    <p style={styles.errorSub}>{scanResult.subMessage}</p>
                                    <button onClick={resetScanner} style={styles.retryBtn}>
                                        Return to Scanner
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    75% { transform: translateX(8px); }
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(11, 15, 91, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(11, 15, 91, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(11, 15, 91, 0); }
                }
                #reader__scan_region {
                    background: #f8fafc !important;
                    border-radius: 20px !important;
                }
                #reader__dashboard_section_csr button {
                    background: #0b0f5b !important;
                    color: white !important;
                    border: none !important;
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    font-family: inherit !important;
                }
            `}</style>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3000,
        padding: '20px',
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: '32px',
        width: '100%',
        maxWidth: '520px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        fontFamily: "'Outfit', sans-serif",
    },
    header: {
        padding: '28px 32px',
        borderBottom: '1.5px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: '20px',
        fontWeight: '800',
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    closeBtn: {
        background: '#f8fafc',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '10px',
        borderRadius: '14px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: '32px',
    },
    eventInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#475569',
        marginBottom: '32px',
        border: '1px solid #f1f5f9',
    },
    timingInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#fffbeb',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#b45309',
        marginBottom: '32px',
        border: '1px solid #fef3c7',
    },
    timingLabel: {
        fontSize: '11px',
        fontWeight: '800',
        color: '#92400e',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    timingValue: {
        fontSize: '14px',
        color: '#b45309',
    },
    scannerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    reader: {
        width: '100%',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '2px solid #f1f5f9',
    },
    hintContainer: {
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#fff',
        padding: '8px 20px',
        borderRadius: '50px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        border: '1.5px solid #f1f5f9',
    },
    hintPulse: {
        width: '8px',
        height: '8px',
        backgroundColor: '#0b0f5b',
        borderRadius: '50%',
        animation: 'pulse 2s infinite',
    },
    hint: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#64748b',
        textAlign: 'center',
        margin: 0,
    },
    resultContainer: {
        textAlign: 'center',
        padding: '10px 0',
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '40px 0',
    },
    loadingText: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#64748b',
    },
    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid #f1f5f9',
        borderTop: '4px solid #0b0f5b',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    successState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'scaleUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    iconWrapperSuccess: {
        marginBottom: '24px',
    },
    resultTitle: {
        fontSize: '24px',
        fontWeight: '900',
        color: '#0f172a',
        margin: '0 0 20px 0',
        letterSpacing: '-0.02em',
    },
    detailsCard: {
        width: '100%',
        backgroundColor: '#f8fafc',
        padding: '24px',
        borderRadius: '20px',
        marginBottom: '32px',
        textAlign: 'left',
        border: '1.5px solid #f1f5f9',
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9',
    },
    detailLabel: {
        fontSize: '13px',
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    detailValue: {
        fontSize: '15px',
        fontWeight: '800',
        color: '#0f172a',
    },
    nextBtn: {
        width: '100%',
        padding: '18px',
        borderRadius: '18px',
        border: 'none',
        background: 'linear-gradient(135deg, #0b0f5b 0%, #0a0d4a 100%)',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.3)',
    },
    errorState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: 'shake 0.5s ease-in-out',
    },
    iconWrapperError: {
        marginBottom: '24px',
    },
    errorSub: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#64748b',
        marginBottom: '32px',
        lineHeight: '1.5',
    },
    retryBtn: {
        width: '100%',
        padding: '18px',
        borderRadius: '18px',
        border: 'none',
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#fff',
        fontSize: '16px',
        fontWeight: '800',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 20px -5px rgba(239, 68, 68, 0.3)',
    },
};

export default QRScannerModal;
