import React from 'react';
import { motion } from 'framer-motion';

const AnimatedButton = ({ children, className = '', onClick, disabled, type = 'button' }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={disabled}
    type={type}
    className={`modern-button relative px-6 py-3 font-bold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-lg ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
  >
    {children}
  </motion.button>
);

export default AnimatedButton;