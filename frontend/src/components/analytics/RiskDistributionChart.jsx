import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const RiskDistributionChart = ({ data = [], hasData = false }) => {
  if (!hasData || !data || data.length === 0 || data.every(d => d.count === 0)) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 dark:text-slate-500 gap-2.5">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center text-slate-400">
          <AlertCircle className="w-5 h-5 stroke-1" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-600 dark:text-slate-300">Not enough assessments yet</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
            Complete your first guided symptom evaluation to see your personalized risk tier distribution.
          </p>
        </div>
      </div>
    );
  }

  const chartData = data.filter(d => d.count > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
      {/* Donut Visualization */}
      <div className="w-48 h-48 relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800">
                      <p className="font-bold flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.tier}</span>
                      </p>
                      <p className="text-slate-300 mt-1 font-medium">
                        {p.count} assessment{p.count === 1 ? '' : 's'} ({p.percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="tier"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={4}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <ShieldCheck className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Risk Tiers</span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="flex-1 w-full space-y-2.5">
        {data.map((item) => (
          <div
            key={item.tier}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {item.tier}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {item.count}
              </span>
              <span className="text-[11px] text-slate-400">
                ({item.percentage}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
