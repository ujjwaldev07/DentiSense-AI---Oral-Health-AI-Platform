import React from 'react';

export const BackgroundGlow = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Primary Ambient Gradient Orbs with Deep Space Clinical Depth */}
      <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] rounded-full bg-teal-500/[0.08] dark:bg-teal-500/[0.13] blur-[110px] ambient-orb-1" />
      <div className="absolute top-1/4 -right-32 w-[36rem] h-[36rem] rounded-full bg-cyan-500/[0.07] dark:bg-cyan-500/[0.12] blur-[120px] ambient-orb-2" />
      <div className="absolute -bottom-32 left-1/4 w-[30rem] h-[30rem] rounded-full bg-emerald-500/[0.05] dark:bg-emerald-500/[0.09] blur-[110px] ambient-orb-3" />
      <div className="absolute top-2/3 right-1/3 w-[26rem] h-[26rem] rounded-full bg-indigo-500/[0.04] dark:bg-indigo-500/[0.07] blur-[130px]" />

      {/* Atmospheric Micro-Grid Layer with Clinical Precision */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
    </div>
  );
};
