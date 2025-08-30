import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-gray-800/60 backdrop-blur-md border border-cyan-500/20 rounded-xl shadow-lg shadow-cyan-500/5 p-6 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-cyan-500/10 ${className}`}>
    {children}
  </div>
);

export default Card;