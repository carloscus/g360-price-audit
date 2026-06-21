import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export const MeshGradient: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("fixed inset-0 z-0 pointer-events-none overflow-hidden bg-mesh", className)}>
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.08] blur-[120px]"
        style={{ backgroundColor: 'var(--color-primary-500)' }}
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.06] blur-[100px]"
        style={{ backgroundColor: 'var(--color-accent-600)' }}
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full opacity-[0.04] blur-[110px]"
        style={{ backgroundColor: 'var(--color-secondary-500)' }}
      />
    </div>
  );
};

export const GrainyBackground: React.FC<React.HTMLAttributes<HTMLDivElement> & { animate?: boolean }> = ({ 
  children, 
  className,
  animate = true,
  ...props 
}) => {
  return (
    <div className={cn("bg-grain min-h-screen", animate && "bg-grain-animate", className)} {...props}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
