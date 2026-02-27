import React, { useState } from "react";
import "./SquadChat.css";

const JoinSquad = ({ onJoin, onCreate }) => {
    const [code, setCode] = useState("");

    const handleCreate = () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        onCreate(newCode);
    };

    const handleJoin = () => {
        if (code.trim().length === 6) {
            onJoin(code.toUpperCase());
        } else {
            alert("Please enter a 6-character code.");
        }
    };

    return (
        <div className="join-squad-view">
            <h2>Join a Squad</h2>
            <p>Enter a squad code to chat with your friends and book tickets together!</p>

            <div className="squad-input-group">
                <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                />
                <button className="squad-btn btn-primary" onClick={handleJoin}>
                    Join Squad
                </button>
            </div>

            <p style={{ margin: "15px 0", color: "#94a3b8", fontSize: "12px" }}>OR</p>

            <button className="squad-btn btn-secondary" onClick={handleCreate} style={{ width: '100%' }}>
                Create New Squad
            </button>
        </div>
    );
};

export default JoinSquad;
