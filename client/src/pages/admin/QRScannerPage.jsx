import React, { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { ShieldCheck, User, Ticket, Calendar, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../config";
import "./QRScannerPage.css";

const QRScannerPage = () => {
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScanning, setIsScanning] = useState(true);
    const [scanKey, setScanKey] = useState(0);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (!isScanning) return;

        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        });

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            const rawText = decodedText.trim();

            if (rawText.length === 24 && /^[0-9a-fA-F]{24}$/.test(rawText)) {
                handleVerify(rawText);
                scanner.clear();
                setIsScanning(false);
                return;
            }

            // 2. Fallback to JSON (Old format)
            try {
                const data = JSON.parse(rawText);
                if (data.id || data.bookingId) {
                    handleVerify(data.id || data.bookingId);
                    scanner.clear();
                    setIsScanning(false);
                } else {
                    setError("This doesn't look like a valid GoGather ticket.");
                }
            } catch (err) {
                console.error("Invalid QR Format", err);
                setError("Unrecognized QR Code. Please ensure it's a valid ticket.");
            }
        }

        function onScanFailure(error) {
            // Silence typical scan failures
        }

        return () => {
            scanner.clear().catch(err => console.error("Scanner cleanup failed", err));
        };
    }, [scanKey, isScanning]);

    const handleVerify = async (bookingId) => {
        setIsProcessing(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.patch(`${API_BASE_URL}/api/bookings/verify-entry`,
                { bookingId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setScanResult(res.data);
        } catch (err) {
            setError({
                message: err.response?.data?.error || "Verification failed",
                code: err.response?.data?.code || "UNKNOWN"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        setIsScanning(true);
        setScanKey(prev => prev + 1);
    };

    return (
        <div className="qr-scanner-container">
            <div className="scanner-card">
                <div className="scanner-header">
                    <ShieldCheck size={48} color="var(--primary-blue)" style={{ marginBottom: '16px' }} />
                    <h2>Entry Verification</h2>
                    <p>Scan the guest's QR code to grant access.</p>
                </div>

                {isScanning && !scanResult && !error && (
                    <div className="reader-wrapper">
                        <div id="reader"></div>
                    </div>
                )}

                {isProcessing && <p>Verifying ticket...</p>}

                {scanResult && (
                    <div className="scan-result-overlay success">
                        <h3>{scanResult.message}</h3>
                        <div className="result-details">
                            <div className="result-row">
                                <label><User size={14} /> Guest</label>
                                <span>{scanResult.details?.userName}</span>
                            </div>
                            <div className="result-row">
                                <label><Ticket size={14} /> Seats</label>
                                <span>{scanResult.details?.seats}</span>
                            </div>
                            <div className="result-row">
                                <label><Calendar size={14} /> Event</label>
                                <span>{scanResult.details?.eventName}</span>
                            </div>
                        </div>
                        <button className="btn-reset" onClick={resetScanner}>Scan Next</button>
                    </div>
                )}

                {error && (
                    <div className="scan-result-overlay error">
                        {error.code === "NOT_STARTED" ? (
                            <Calendar size={32} style={{ marginBottom: '10px', color: '#f59e0b' }} />
                        ) : error.code === "ALREADY_SCANNED" ? (
                            <AlertCircle size={32} style={{ marginBottom: '10px', color: '#f59e0b' }} />
                        ) : (
                            <AlertCircle size={32} style={{ marginBottom: '10px' }} />
                        )}
                        <h3>{error.code === "ALREADY_SCANNED" ? "Ticket Used" : error.code === "NOT_STARTED" ? "Too Early" : "Access Denied"}</h3>
                        <p>{error.message}</p>
                        <button className="btn-reset" onClick={resetScanner} style={{ background: error.code === "NOT_STARTED" || error.code === "ALREADY_SCANNED" ? '#f59e0b' : '#ef4444' }}>
                            {error.code === "ALREADY_SCANNED" ? "Scan Another" : "Retry"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerPage;
