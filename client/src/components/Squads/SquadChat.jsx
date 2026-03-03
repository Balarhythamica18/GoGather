import React, { useState, useEffect, useRef } from "react";
import socket from "../../socket";
import { Send, Copy, LogOut, Users, X } from "lucide-react";
import { toast } from "react-hot-toast";
import JoinSquad from "./JoinSquad";
import VoiceRecorder from "./VoiceRecorder";
import AudioMessage from "./AudioMessage";
import "./SquadChat.css";

const SquadChat = ({ onClose }) => {
    const [isInSquad, setIsInSquad] = useState(false);
    const [squadCode, setSquadCode] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [user, setUser] = useState(null);
    const [moderationAlert, setModerationAlert] = useState(null);

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

        socket.on("squad-moderation-blocked", (data) => {
            console.log("[SQUAD] Moderation block received:", data);
            setModerationAlert(data);

            // Remove the optimistically added message
            setMessages((prev) => prev.filter(msg => msg.id !== data.id));

            // Auto hide alert after 8 seconds
            setTimeout(() => setModerationAlert(null), 8000);
        });

        return () => {
            socket.off("receive-squad-message");
            socket.off("squad-notification");
            socket.off("squad-moderation-blocked");
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
        if (e) e.preventDefault();
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

    const handleSendVoice = (audioUrl) => {
        if (user) {
            const tempId = Date.now() + Math.random().toString(36).substr(2, 9);
            const messageData = {
                id: tempId,
                audioUrl: audioUrl,
                sender: { _id: user._id, name: user.name },
                timestamp: new Date()
            };
            setMessages(prev => [...prev, messageData]);
            socket.emit("send-squad-message", {
                id: tempId,
                code: squadCode,
                audioUrl,
                user: { _id: user._id, name: user.name }
            });
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
                <div className="squad-header-left">
                    <div className="squad-icon-wrap"><Users size={20} /></div>
                    <span className="squad-title">Squad Chat</span>
                </div>
                <div className="squad-header-right">
                    {isInSquad && (
                        <>
                            <div className="squad-code-badge" onClick={copyCode} title="Copy Code">
                                <span>{squadCode}</span> <Copy size={12} />
                            </div>
                            <button className="squad-header-btn logout" onClick={handleLeaveSquad} title="Leave Squad">
                                <LogOut size={18} />
                            </button>
                        </>
                    )}
                    {onClose && (
                        <button className="squad-header-btn close" onClick={onClose} title="Close Chat">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {!user ? (
                <div className="login-required-view">
                    <div className="login-required-icon">
                        <Users size={48} opacity={0.2} />
                    </div>
                    <h2>Login Required</h2>
                    <p>You need to be logged in to join or create a squad and chat with others.</p>
                    <button
                        className="squad-btn btn-primary"
                        onClick={() => window.location.href = '/login'}
                    >
                        Go to Login
                    </button>
                </div>
            ) : !isInSquad ? (
                <JoinSquad onJoin={handleJoinSquad} onCreate={handleJoinSquad} />
            ) : (
                <>
                    {moderationAlert && (
                        <div className="moderation-overlay">
                            <div className="moderation-content">
                                <div className="moderation-header">
                                    <X className="moderation-icon" size={32} />
                                    <h3>Security Policy Violation</h3>
                                </div>
                                <p>{moderationAlert.message}</p>
                                <div className="moderation-hint">
                                    Please avoid using harmful, threatening, or immoral language in the squad chat.
                                </div>
                                <button className="moderation-close-btn" onClick={() => setModerationAlert(null)}>
                                    I Understand
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="squad-messages">
                        {messages.map((msg, idx) => (
                            msg.isNotification ? (
                                <div key={msg.id || idx} className="squad-notification">{msg.message}</div>
                            ) : (
                                <div key={msg.id || idx} className={`message-bubble ${msg.sender._id === user?._id ? 'msg-sent' : 'msg-received'}`}>
                                    {msg.sender._id !== user?._id && <div className="msg-sender">{msg.sender.name}</div>}
                                    {msg.audioUrl ? (
                                        <AudioMessage audioUrl={msg.audioUrl} isSent={msg.sender._id === user?._id} />
                                    ) : (
                                        msg.text
                                    )}
                                    <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="squad-footer">
                        <form className="squad-input-area" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <div className="squad-input-actions">
                                <VoiceRecorder onSend={handleSendVoice} />
                                <button
                                    type="submit"
                                    className={`squad-send-btn ${!message.trim() ? 'btn-disabled' : ''}`}
                                    disabled={!message.trim()}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default SquadChat;
