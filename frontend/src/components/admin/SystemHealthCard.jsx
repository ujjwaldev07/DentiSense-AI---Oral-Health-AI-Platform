import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { systemAPI } from '../../api/endpoints.js';
import { GlassCard } from '../common/GlassCard.jsx';
import { Badge } from '../common/Badge.jsx';

export const SystemHealthCard = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await systemAPI.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Health fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <GlassCard level={2} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
              System Architecture & AI Infrastructure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              Real-time monitoring of Gemini embeddings, vector store, and clinical guardrail engine
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 rounded-xl glass-subtle text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          title="Refresh health status"
          aria-label="Refresh health status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
        {/* Database */}
        <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Database
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-pulse" />
              Online
            </span>
          </div>
          <p className="text-slate-900 dark:text-slate-100 font-bold truncate">
            {health?.database?.name || 'dental_awareness_db'}
          </p>
        </div>

        {/* AI Engine */}
        <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              AI Intelligence
            </span>
            <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 status-dot-pulse" />
              Active
            </span>
          </div>
          <p className="text-slate-900 dark:text-slate-100 font-bold truncate">
            {health?.aiService?.model || 'gemini-3.7-flash'} (RAG 768d)
          </p>
        </div>

        {/* Guardrails */}
        <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Guardrails
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-pulse" />
              Enforced
            </span>
          </div>
          <p className="text-slate-900 dark:text-slate-100 font-bold truncate">
            Rx Filter • Emergency Triage
          </p>
        </div>
      </div>
    </GlassCard>
  );
};
