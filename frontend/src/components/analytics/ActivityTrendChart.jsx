import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

export const ActivityTrendChart = ({ data = [], days = 30, onSelectDays }) => {
  const hasData = data && data.length > 0 && data.some(d => (d.total || d.activities || 0) > 0);

  return (
    <div className="space-y-4">
      {/* Timeframe selector header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Your Oral Health Activity</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Daily consultations and symptom checks recorded across this timeframe.
          </p>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] self-start sm:self-auto">
          {[
            { label: '7 Days', val: 7 },
            { label: '30 Days', val: 30 },
            { label: '90 Days', val: 90 }
          ].map((btn) => (
            <button
              key={btn.val}
              onClick={() => onSelectDays && onSelectDays(btn.val)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                days === btn.val
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {!hasData ? (
        <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 dark:text-slate-500 gap-2">
          <Activity className="w-6 h-6 stroke-1 text-slate-300 dark:text-slate-600" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-600 dark:text-slate-300">No activity in this window</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Start an oral consultation or check symptoms to see your timeline build.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-60 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={days > 30 ? 6 : (days > 7 ? 3 : 0)}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                allowDecimals={false}
                stroke="#cbd5e1"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload;
                    return (
                      <div className="p-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 space-y-1">
                        <p className="font-bold text-teal-400">{p.date}</p>
                        <div className="space-y-0.5 text-slate-300">
                          <p className="flex justify-between gap-4">
                            <span>Consultations:</span>
                            <span className="font-mono font-bold text-white">{p.chats || 0}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span>Assessments:</span>
                            <span className="font-mono font-bold text-white">{p.assessments || 0}</span>
                          </p>
                          <div className="pt-1 mt-1 border-t border-slate-800 flex justify-between gap-4 font-bold text-teal-300">
                            <span>Total Activities:</span>
                            <span className="font-mono">{p.total || p.activities || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#activityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
