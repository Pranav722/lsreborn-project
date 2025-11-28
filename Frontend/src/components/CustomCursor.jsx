import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('a')) {
            setIsHovering(true);
        } else {
            setIsHovering(false);
        }
    };

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    return () => {
        window.removeEventListener("mousemove", mouseMove);
        window.removeEventListener("mouseover", handleMouseOver);
    }
  }, []);

  return (
    <>
      {/* Outer Ring - Changes on hover */}
      <motion.div
        className="fixed top-0 left-0 w-6 h-6 border-2 rounded-full pointer-events-none z-[9999]"
        animate={{ 
            x: mousePosition.x - 12, 
            y: mousePosition.y - 12,
            scale: isHovering ? 1.5 : 1,
            opacity: isHovering ? 1 : 0.5,
            borderColor: isHovering ? '#22d3ee' : '#ffffff' // Cyan on hover, White normally
        }}
        // Extremely fast transition to minimize latency feeling
        transition={{ type: "tween", ease: "linear", duration: 0.05 }}
      />
      
      {/* Inner Dot - Sharp and precise */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999]"
        animate={{ 
            x: mousePosition.x - 3, 
            y: mousePosition.y - 3,
            backgroundColor: isHovering ? '#22d3ee' : '#ffffff'
        }}
        transition={{ type: "tween", ease: "linear", duration: 0 }}
      />
    </>
  );
};

export default CustomCursor;