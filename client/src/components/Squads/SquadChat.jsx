import React, { useState, useEffect, useRef } from "react";
import socket from "../../socket";
import { Send, Copy, LogOut, Users, X } from "lucide-react";
import { toast } from "react-hot-toast";
import JoinSquad from "./JoinSquad";
import "./SquadChat.css";

const SquadChat = () => {
    const [isInSquad, setIsInSquad] = useState(false);
    const [squadCode, setSquadCode] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [user, setUser] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser) setUser(storedUser);

        socket.on("receive-squad-message", (messageData) => {
            setMessages((prev) => {
                if (prev.some(m => m.id === messageData.id)) return prev;
                return [...prev, messageData];
            });
        });

        socket.on("squad-notification", (notification) => {
            setMessages((prev) => [...prev, { ...notification, isNotification: true, id: Date.now() + Math.random() }]);
        });

        return () => {
            socket.off("receive-squad-message");
            socket.off("squad-notification");
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleJoinSquad = (code) => {
        if (!user) {
            toast.error("Please login first");
            return;
        }
        setSquadCode(code);
        setIsInSquad(true);
        socket.emit("join-squad", { code, user });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && user) {
            const tempId = Date.now() + Math.random().toString(36).substr(2, 9);
            const messageData = {
                id: tempId,
                text: message.trim(),
                sender: { _id: user._id, name: user.name },
                timestamp: new Date()
            };
            setMessages(prev => [...prev, messageData]);
            socket.emit("send-squad-message", { id: tempId, code: squadCode, message: message.trim(), user: { _id: user._id, name: user.name } });
            setMessage("");
        }
    };

    const handleLeaveSquad = () => {
        socket.emit("leave-squad", { code: squadCode, user });
        setIsInSquad(false);
        setSquadCode("");
        setMessages([]);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(squadCode);
        toast.success("Code copied!");
    };

    return (
        <div className="squad-content">
            <div className="squad-header">
                <div className="squad-header-info">
                    <div className="squad-icon-wrap"><Users size={18} /></div>
                    <span className="squad-title">Squad Chat</span>
                </div>
                {isInSquad && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="squad-code-badge" onClick={copyCode}>
                            {squadCode} <Copy size={12} />
                        </div>
                        <button onClick={handleLeaveSquad} style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>

            {!isInSquad ? (
                <JoinSquad onJoin={handleJoinSquad} onCreate={handleJoinSquad} />
            ) : (
                <>
                    <div className="squad-messages">
                        {messages.map((msg, idx) => (
                            msg.isNotification ? (
                                <div key={msg.id || idx} className="squad-notification">{msg.message}</div>
                            ) : (
                                <div key={msg.id || idx} className={`message-bubble ${msg.sender._id === user?._id ? 'msg-sent' : 'msg-received'}`}>
                                    {msg.sender._id !== user?._id && <div className="msg-sender">{msg.sender.name}</div>}
                                    {msg.text}
                                    <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="squad-footer">
                        <form className="squad-input-area" onSubmit={handleSendMessage}>
                            <input type="text" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                            <button type="submit" className="squad-send-btn"><Send size={18} /></button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default SquadChat;
