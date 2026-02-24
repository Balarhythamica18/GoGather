import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, color = '#ff007a' }) => {
    return (
        <div style={styles.card}>
            <div style={styles.content}>
                <div style={styles.info}>
                    <span style={styles.title}>{title}</span>
                    <h3 style={styles.value}>{value}</h3>
                    {trend && (
                        <div style={{ ...styles.trend, color: trend.isPositive ? '#10b981' : '#f43f5e' }}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}% vs last month
                        </div>
                    )}
                </div>
                <div style={{ ...styles.iconWrapper, backgroundColor: `${color}15` }}>
                    <Icon size={24} color={color} />
                </div>
            </div>
        </div>
    );
};

const styles = {
    card: {
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'transform 0.2s ease',
    },
    content: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    info: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    title: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
    },
    value: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0,
    },
    trend: {
        fontSize: '12px',
        fontWeight: '500',
        marginTop: '4px',
    },
    iconWrapper: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default StatCard;
