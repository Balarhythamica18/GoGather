import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = 'var(--primary)' }) => {
    return (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {title}
                    </span>
                    <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: '8px 0' }}>
                        {value}
                    </h3>
                    {trend && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: trend.startsWith('+') ? 'var(--success)' : 'var(--accent)' }}>
                           <span style={{ fontSize: '10px' }}>{trend.startsWith('+') ? '▲' : '▼'}</span> {trend}
                        </div>
                    )}
                </div>
                <div style={{ padding: '12px', background: `${color}10`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color={color} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
