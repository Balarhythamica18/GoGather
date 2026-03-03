import React, { useState } from "react";
import { Users, X } from "lucide-react";
import SquadChat from "./SquadChat";
import { toast } from "react-hot-toast";
import "./SquadChat.css";

const FloatingSquadChat = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChat = () => {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");

        if (!token || !user) {
            toast.error("Please log in to join the Squad Chat", {
                duration: 4000,
                position: "bottom-center",
                icon: '🔒',
                style: {
                    borderRadius: '12px',
                    background: '#1e293b',
                    color: '#fff',
                    padding: '16px',
                    fontWeight: '600',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
