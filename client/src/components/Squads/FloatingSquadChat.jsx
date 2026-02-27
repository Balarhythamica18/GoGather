import React, { useState } from "react";
import { Users, X } from "lucide-react";
import SquadChat from "./SquadChat";
import "./SquadChat.css";

const FloatingSquadChat = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="squad-floating-container">
            {isOpen && (
                <div className="squad-window">
                    {/* Header already in SquadChat but we can add a close button here or in SquadChat */}
                    <div style={{ position: 'absolute', top: '18px', right: '55px', zIndex: 10 }}>
                        {/* Position adjusted to not overlap with existing header buttons */}
                    </div>
                    <SquadChat />
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '18px',
                            right: '15px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            zIndex: 100
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            <button
                className="squad-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Squad Chat"
            >
                <Users size={24} strokeWidth={2.2} />
            </button>
        </div>
    );
};

export default FloatingSquadChat;
