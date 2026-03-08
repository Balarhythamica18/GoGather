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
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
        });

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText) {
            try {
                const data = JSON.parse(decodedText);
                if (data.id) {
                    handleVerify(data.id);
                    scanner.clear();
                }
            } catch (err) {
                console.error("Invalid QR Format", err);
            }
        }

        function onScanFailure(error) {
            // Silence typical scan failures
        }

        return () => {
            scanner.clear().catch(err => console.error("Scanner cleanup failed", err));
        };
    }, []);

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
            setError(err.response?.data?.error || "Verification failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanResult(null);
        setError(null);
        window.location.reload(); // Simplest way to restart the library properly
    };

    return (
        <div className="qr-scanner-container">
            <div className="scanner-card">
                <div className="scanner-header">
                    <ShieldCheck size={48} color="var(--primary-blue)" style={{ marginBottom: '16px' }} />
                    <h2>Entry Verification</h2>
                    <p>Scan the guest's QR code to grant access.</p>
                </div>

                {!scanResult && !error && (
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
                        <AlertCircle size={32} style={{ marginBottom: '10px' }} />
                        <h3>Access Denied</h3>
                        <p>{error}</p>
                        <button className="btn-reset" onClick={resetScanner} style={{ background: '#ef4444' }}>Retry</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScannerPage;
