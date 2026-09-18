import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'teal',
  onClick,
  className = ''
}) => {
  const colorMap = {
    teal: {
      border: 'border-teal-500/20 hover:border-teal-500/40',
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      glow: 'from-teal-500/5 to-transparent'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      glow: 'from-cyan-500/5 to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/5 to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/5 to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/5 to-transparent'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/5 to-transparent'
    }
  };

  const style = colorMap[color] || colorMap.teal;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-5 sm:p-6 rounded-2xl glass-elevated border ${style.border} transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''
      } ${className}`}
    >
      {/* Subtle Top-Right Ambient Radial Light */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.glow} blur-2xl pointer-events-none`} />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="pt-1">
              <span
                className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  trendPositive
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                }`}
              >
                {trend}
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${style.iconBg} shrink-0 backdrop-blur-xs shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
