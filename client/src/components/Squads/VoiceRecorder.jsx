import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import './SquadChat.css';

const VoiceRecorder = ({ onSend }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                cleanup();
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Microphone error:', error);
            toast.error('Microphone permission denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
        cleanup();
        setIsRecording(false);
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const handleUpload = async () => {
        if (!audioBlob) return;

        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice-message.webm');

        try {
            const response = await axios.post(
                'http://localhost:5000/api/squad/upload-voice',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            onSend(response.data.audioUrl);

            setAudioBlob(null);
            setRecordingTime(0);

        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Voice upload failed');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="vr-container">

            {/* Default Mic Button */}
            {!isRecording && !audioBlob && (
                <button
                    type="button"
                    className="vr-icon-btn vr-mic"
                    onClick={startRecording}
                >
                    <Mic size={20} />
                </button>
            )}

            {/* Recording State */}
            {isRecording && (
                <div className="vr-recording-bar">
                    <div className="vr-left">
                        <div className="vr-dot"></div>
                        <span>{formatTime(recordingTime)}</span>
                    </div>

                    <div className="vr-actions">
                        <button
                            type="button"
                            className="vr-icon-btn vr-cancel"
                            onClick={cancelRecording}
                        >
                            <Trash2 size={18} />
                        </button>

                        <button
                            type="button"
                            className="vr-icon-btn vr-stop"
                            onClick={stopRecording}
                        >
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>
                </div>
            )}

            {/* Preview State */}
            {!isRecording && audioBlob && (
                <div className="vr-preview-bar">
                    <span>Voice {formatTime(recordingTime)}</span>

                    <div className="vr-actions">
                        <button
                            type="button"
                            className="vr-icon-btn vr-cancel"
                            onClick={cancelRecording}
                        >
                            <X size={18} />
                        </button>

                        <button
                            type="button"
                            className="vr-icon-btn vr-send"
                            onClick={handleUpload}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoiceRecorder;