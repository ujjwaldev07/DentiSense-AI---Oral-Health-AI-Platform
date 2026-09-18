import React from 'react';

/**
 * Reusable Multi-Level Glassmorphism Card Container
 * 
 * Levels:
 * - 1: Subtle (background panels, secondary containers)
 * - 2: Elevated (standard dashboard cards, content containers)
 * - 3: Interactive (hover lift, border illumination, click response)
 * - 4: Modal (high-contrast modal panels, focused overlays)
 */
export const GlassCard = ({
  children,
  level = 2,
  glow = 'none',
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const levelClasses = {
    1: 'glass-subtle rounded-2xl p-4 sm:p-5',
    2: 'glass-elevated rounded-2xl p-5 sm:p-6',
    3: 'glass-interactive rounded-2xl p-5 sm:p-6 cursor-pointer',
    4: 'glass-modal rounded-3xl p-6 sm:p-8'
  };

  const glowClasses = {
    teal: 'border-teal-500/30 shadow-lg shadow-teal-500/10',
    cyan: 'border-cyan-500/30 shadow-lg shadow-cyan-500/10',
    emerald: 'border-emerald-500/30 shadow-lg shadow-emerald-500/10',
    amber: 'border-amber-500/30 shadow-lg shadow-amber-500/10',
    rose: 'border-rose-500/30 shadow-lg shadow-rose-500/10',
    none: ''
  };

  return (
    <Component
      className={`${levelClasses[level] || levelClasses[2]} ${glowClasses[glow] || ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
