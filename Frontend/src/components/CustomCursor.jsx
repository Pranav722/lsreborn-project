import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);

  // Use MotionValues for high-performance updates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the "trailing" effect
  const springX = useSpring(mouseX, { stiffness: 500, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 28 });

  useEffect(() => {
    const mouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      // Detect if hovering over interactive elements
      const target = e.target;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
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
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 3D Floating Diamond Outer Layer */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          className="relative -ml-3 -mt-3"
          animate={{
            scale: isHovering ? 1.5 : 1,
            rotate: isHovering ? 45 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* The 3D Shape Construction */}
          <div className={`w-6 h-6 border-2 transition-colors duration-200 ease-out ${isHovering ? 'border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'border-cyan-500/50'} backdrop-blur-sm`}
            style={{
              transform: 'perspective(500px) rotateX(20deg) rotateY(20deg)',
              borderRadius: '4px'
            }}
          />
        </motion.div>
      </motion.div>

      {/* Center Precision Dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[9999]"
        style={{ x: mouseX, y: mouseY }}
        animate={{
          x: -3, // Center offset
          y: -3,
          scale: isHovering ? 0.5 : 1, // Shrink dot on hover for precision look
        }}
        transition={{ duration: 0 }}
      />
    </>
  );
};

export default CustomCursor;