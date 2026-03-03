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
                    <SquadChat onClose={() => setIsOpen(false)} />
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
