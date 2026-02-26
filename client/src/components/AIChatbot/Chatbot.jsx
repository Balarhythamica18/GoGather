import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Send, X, Bot, Loader2, MinusCircle, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import "./Chatbot.css";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, loading, isOpen, isMinimized]);

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
            const res = await axios.post("http://localhost:5000/api/ai/chat", {
                message: input.trim(),
            });

            const aiMsg = {
                role: "ai",
                text: res.data.reply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = {
                role: "ai",
                text: error.response?.data?.reply || "⚠️ Connection error. Please try again later.",
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
                <button onClick={() => setIsOpen(true)} className="chatbot-trigger">
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
                                    <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                                        Ask me about upcoming tickets, event details, or your current bookings!
                                    </div>
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
                                    <Loader2 size={16} className="spinner" />
                                    <span>AI is drafting a reply...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chatbot-input-area">
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
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
