import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const AudioMessage = ({ audioUrl, isSent }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef(null);

    // Generate static "waveform" bars
    const bars = [18, 24, 15, 30, 22, 12, 18, 25, 20, 15, 28, 22, 16, 24, 18];

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        if (total) {
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatTime = (time) => {
        if (isNaN(time) || !isFinite(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className={`premium-audio-container ${isSent ? 'sent' : 'received'}`}>
            <button className="premium-audio-play" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>

            <div className="premium-audio-content">
                <div className="premium-waveform">
                    {bars.map((height, i) => {
                        const barPosition = (i / bars.length) * 100;
                        const isActive = progress > barPosition;
                        return (
                            <div
                                key={i}
                                className={`waveform-bar ${isActive ? 'active' : ''}`}
                                style={{
                                    height: `${height}px`,
                                    transitionDelay: `${i * 30}ms`
                                }}
                            />
                        );
                    })}
                </div>
                <div className="premium-audio-meta">
                    <span className="premium-duration">
                        {isPlaying ? formatTime(audioRef.current?.currentTime) : formatTime(duration)}
                    </span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={audioUrl.startsWith('http') ? audioUrl : `${API_BASE_URL}${audioUrl}`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
        </div>
    );
};
export default AudioMessage;
