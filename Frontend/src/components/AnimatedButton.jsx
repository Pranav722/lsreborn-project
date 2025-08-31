import React from 'react';

const AnimatedButton = ({ children, className = '', ...props }) => (
  <button
    className={`modern-button relative px-6 py-3 font-bold text-white rounded-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default AnimatedButton;