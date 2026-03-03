import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Send, X, Bot, Loader2, MinusCircle, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL } from "../../config";
import "./Chatbot.css";
import { toast } from "react-hot-toast";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [moderationAlert, setModerationAlert] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            const user = localStorage.getItem("user");
            setIsLoggedIn(!!(token && user));
        };

        window.addEventListener("storageChange", checkAuth);
        window.addEventListener("storage", checkAuth);
        checkAuth();

        return () => {
            window.removeEventListener("storageChange", checkAuth);
            window.removeEventListener("storage", checkAuth);
        };
    }, []);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, loading, isOpen, isMinimized]);

    const handleOpenChat = () => {
        setIsOpen(true);
    };

    const send = async () => {
        if (!input.trim() || loading) return;

        const userMsg = {
            role: "user",
            text: input.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(`${API_BASE_URL}/api/ai/chat`, {
                message: input.trim(),
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const aiMsg = {
                role: "ai",
                text: res.data.reply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat Error:", error);

            // Check for moderation block (403 Forbidden)
            if (error.response?.status === 403) {
                setModerationAlert(true);
                // Also remove the harmful message from local state for security
                setMessages(prev => prev.filter((_, idx) => idx !== prev.length - 1));
                return;
            }

            if (error.response?.status === 401) {
                const expiredMsg = {
                    role: "ai",
                    text: "🔒 **Session Expired.** Please log in again to continue your conversation with GoGather AI.",
                    isError: true,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, expiredMsg]);
                setIsLoggedIn(false);
                return;
            }

            const errorText = error.response?.status === 401
                ? "🔒 Please log in to continue."
                : error.response?.data?.reply || "⚠️ Connection error. Please try again later.";

            const errorMsg = {
                role: "ai",
                text: errorText,
                isError: true,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div className="chatbot-container">
                <button onClick={handleOpenChat} className="chatbot-trigger">
                    <MessageSquare size={28} strokeWidth={2.5} />
                    <span className="notification-badge"></span>
                </button>
            </div>
        );
    }

    return (
        <div className="chatbot-container">
            <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
                <div className="chatbot-header">
                    <div className="chatbot-header-info">
                        <div className="chatbot-icon-wrap">
                            <Bot size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '-0.3px' }}>GoGather AI</div>
                            <div className="chatbot-status">
                                <span className="status-dot"></span>
                                <span>Agent Online</span>
                            </div>
                        </div>
                    </div>
                    <div className="chatbot-actions">
                        <button className="chatbot-action-btn" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Maximize" : "Minimize"}>
                            {isMinimized ? <Maximize2 size={18} /> : <MinusCircle size={18} />}
                        </button>
                        <button className="chatbot-action-btn" onClick={() => setIsOpen(false)} title="Close">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        <div className="chatbot-messages">
                            {messages.length === 0 && (
                                <div className="empty-chat">
                                    <div className="bot-icon">
                                        <Bot size={48} strokeWidth={1.5} />
                                    </div>
                                    <div style={{ fontWeight: '800', color: '#111827', fontSize: '18px', marginBottom: '8px' }}>How can I help you?</div>
                                    {!isLoggedIn ? (
                                        <div className="login-required-card">
                                            <div className="lock-icon-bg">
                                                <Bot size={24} className="lock-icon-bot" />
                                            </div>
                                            <h3>AI Access Restricted</h3>
                                            <p>Please log in to GoGather to start a conversation with our smart assistant.</p>
                                            <button
                                                className="chat-login-btn"
                                                onClick={() => window.location.href = '/login'}
                                            >
                                                Log in to Continue
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                            Ask me about upcoming tickets, event details, or your current bookings!
                                        </div>
                                    )}
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div key={i} className={`message-bubble ${m.role === 'user' ? 'message-user' : 'message-ai'}`}>
                                    <div className="message-meta">
                                        <span>{m.role === 'user' ? 'You' : 'GoGather AI'}</span>
                                        <span>{m.time}</span>
                                    </div>
                                    {m.role === 'ai' ? (
                                        <ReactMarkdown>{m.text}</ReactMarkdown>
                                    ) : (
                                        <div>{m.text}</div>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="thinking-indicator">
                                    <div className="modern-spinner">
                                        <div className="spinner-ring"></div>
                                        <div className="spinner-ring-inner"></div>
                                    </div>
                                    <span>AI is drafting a reply...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chatbot-input-area">
                            {isLoggedIn ? (
                                <div className="input-container">
                                    <input
                                        className="chatbot-input"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && send()}
                                        placeholder="Type your message..."
                                        disabled={loading}
                                    />
                                    <button
                                        className="chatbot-send-btn"
                                        onClick={send}
                                        disabled={!input.trim() || loading}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="login-notice-area">
                                    <X size={14} className="lock-mini" />
                                    <span>Sign in to send messages</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Security Policy Violation Overlay */}
            {
                moderationAlert && (
                    <div className="moderation-overlay">
                        <div className="moderation-content">
                            <div className="moderation-header">
                                <div className="moderation-icon">
                                    <X size={32} strokeWidth={3} />
                                </div>
                                <h3>Security Policy Violation</h3>
                            </div>
                            <p>
                                Don't use harmful, threatening, or immoral words in this chat. Please follow our safety policies.
                            </p>
                            <div className="moderation-hint">
                                Violation Detected
                            </div>
                            <button
                                className="moderation-close-btn"
                                onClick={() => setModerationAlert(false)}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
