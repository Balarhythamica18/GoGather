import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, style, className = "" }) => {
    const customStyles = {
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '8px',
        ...style
    };

    return (
        <div
            className={`skeleton-loader ${className}`}
            style={customStyles}
        ></div>
    );
};

export default Skeleton;
