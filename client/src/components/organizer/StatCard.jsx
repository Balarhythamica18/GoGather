import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = '#0b0f5b' }) => {
    const isPositive = trend?.startsWith('+');
    
    return (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className="stat-card-info">
                    <span className="stat-card-title">{title}</span>
                    <h3 className="stat-card-value">{value}</h3>
                    {trend && (
                        <div className={`stat-card-trend ${isPositive ? 'positive' : 'negative'}`}>
                           <span className="trend-arrow">{isPositive ? '▲' : '▼'}</span> {trend}
                        </div>
                    )}
                </div>
                <div className="stat-card-icon-box" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={24} color={color} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
