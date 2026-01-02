import React from 'react';

const Title = ({ text1, text2 }) => {
  // Inline styles
  const titleStyle = {
    fontWeight: 500, // font-medium
    fontSize: '1.5rem', // text-2xl
    margin: 0,
    padding:'20px'
  };

  const text2Style = {
    textDecoration: 'underline', 
    color: '#ff007a',
  };

  return (
    <h1 style={titleStyle}>
      {text1} <span style={text2Style}>{text2}</span>
    </h1>
  );
};

export default Title;
