import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`bg-gray-900/80 backdrop-blur-md border border-cyan-500/20 rounded-xl shadow-lg shadow-black/50 p-6 hover:border-cyan-500/40 transition-colors ${className}`}
  >
    {children}
  </motion.div>
);

export default Card;