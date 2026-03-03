import React, { useState } from "react";
import { Users, X } from "lucide-react";
import SquadChat from "./SquadChat";
import { toast } from "react-hot-toast";
import "./SquadChat.css";

const FloatingSquadChat = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChat = () => {
        const user = localStorage.getItem("user");
        if (!user) {
            toast.error("Please log in to join professional squad chat", {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
            return;
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="squad-floating-container">
            {isOpen && (
                <div className="squad-window">
                    <SquadChat onClose={() => setIsOpen(false)} />
                </div>
            )}

            <button
                className="squad-trigger"
                onClick={handleOpenChat}
                title="Squad Chat"
            >
                <Users size={24} strokeWidth={2.2} />
            </button>
        </div>
    );
};

export default FloatingSquadChat;
