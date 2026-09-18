import React from 'react';
import { MessageSquare, Activity, BookOpen, BarChart3, ArrowRight } from 'lucide-react';
import { GlassCard } from '../common/GlassCard.jsx';

export const QuickActions = ({ onNavigate }) => {
  const actions = [
    {
      id: 'chat',
      title: 'AI Consultation',
      desc: 'Ask questions about tooth pain, swelling, or daily hygiene',
      icon: MessageSquare,
      color: 'teal'
    },
    {
      id: 'assessment',
      title: 'Symptom Triage',
      desc: '5-step risk assessment & questions for your dentist',
      icon: Activity,
      color: 'cyan'
    },
    {
      id: 'knowledge',
      title: 'Knowledge Library',
      desc: 'Explore peer-reviewed guides in EN, HI & MR',
      icon: BookOpen,
      color: 'amber'
    },
    {
      id: 'analytics',
      title: 'Health Trends',
      desc: 'Track personal pain scores & consultation history',
      icon: BarChart3,
      color: 'emerald'
    }
  ];

  const colorStyles = {
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <GlassCard
            key={act.id}
            level={3}
            onClick={() => onNavigate(act.id)}
            className="group text-left space-y-3"
          >
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${colorStyles[act.color]} shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                <span>{act.title}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-teal-500" />
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 font-normal">
                {act.desc}
              </p>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
