import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    PlusCircle,
    LogOut,
    Settings,
    Calendar,
    ChevronRight,
    UserCircle
} from 'lucide-react';
import Logo from '../common/Logo';

const DashboardSidebar = ({ organizerName, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener("toggleOrganizerSidebar", handleToggle);
        return () => window.removeEventListener("toggleOrganizerSidebar", handleToggle);
    }, []);

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
        { id: 'add-event', icon: PlusCircle, label: 'Create Event', path: '/add-event' },
    ];

    return (
        <>
            <div
                className={`sidebar-overlay ${isOpen ? 'show' : ''}`}
                onClick={() => setIsOpen(false)}
            />
            <aside className={`organizer-sidebar ${isOpen ? 'open' : ''}`}>
                <style>{`
                    .organizer-sidebar {
                        width: 260px;
                        height: 100vh;
                        position: fixed;
                        left: 0;
                        top: 0;
                        background: #ffffff;
                        border-right: 1px solid #e2e8f0;
                        display: flex;
                        flex-direction: column;
                        padding: 32px 16px;
                        z-index: 1000;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }

                    .sidebar-logo {
                        padding: 0 12px 32px 12px;
                        border-bottom: 1px solid #f1f5f9;
                        margin-bottom: 32px;
                    }

                    .sidebar-nav {
                        display: flex;
                        flex-direction: column;
                        gap: 6px;
                        flex: 1;
                    }

                    .nav-button {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px 16px;
                        border-radius: 12px;
                        border: none;
                        background: transparent;
                        color: #64748b;
                        font-family: inherit;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        text-align: left;
                        position: relative;
                    }

                    .nav-button:hover {
                        background: #f8fafc;
                        color: #0b0f5b;
                    }

                    .nav-button.active {
                        background: #eff6ff;
                        color: #0b0f5b;
                    }

                    .nav-button.active::after {
                        content: '';
                        position: absolute;
                        right: 8px;
                        width: 6px;
                        height: 6px;
                        background: #0b0f5b;
                        border-radius: 50%;
                    }

                    .sidebar-footer {
                        margin-top: auto;
                        padding-top: 24px;
                        border-top: 1px solid #f1f5f9;
                    }

                    .user-profile {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        padding: 12px;
                        background: #f8fafc;
                        border-radius: 16px;
                        margin-bottom: 16px;
                    }

                    .user-avatar {
                        width: 40px;
                        height: 40px;
                        background: #0b0f5b;
                        color: white;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 16px;
                    }

                    .user-info {
                        flex: 1;
                        min-width: 0;
                    }

                    .user-name {
                        font-size: 14px;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .user-role {
                        font-size: 12px;
                        color: #64748b;
                        margin: 0;
                    }

                    .logout-button {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        border-radius: 12px;
                        border: 1px solid #fee2e2;
                        background: transparent;
                        color: #ef4444;
                        font-weight: 600;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .logout-button:hover {
                        background: #fef2f2;
                    }

                    @media (max-width: 1024px) {
                        .organizer-sidebar {
                            transform: translateX(-100%);
                        }
                        .organizer-sidebar.open {
                            transform: translateX(0);
                        }
                        .sidebar-overlay {
                            position: fixed;
                            inset: 0;
                            background: rgba(15, 23, 42, 0.4);
                            backdrop-filter: blur(4px);
                            z-index: 999;
                            opacity: 0;
                            visibility: hidden;
                            transition: all 0.3s;
                        }
                        .sidebar-overlay.show {
                            opacity: 1;
                            visibility: visible;
                        }
                    }
                `}</style>

                <div className="sidebar-logo">
                    <Logo />
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsOpen(false);
                                }}
                                className={`nav-button ${isActive ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            {organizerName?.charAt(0) || 'O'}
                        </div>
                        <div className="user-info">
                            <p className="user-name">{organizerName || 'Organizer'}</p>
                            <p className="user-role">Business Member</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="logout-button">
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default DashboardSidebar;
