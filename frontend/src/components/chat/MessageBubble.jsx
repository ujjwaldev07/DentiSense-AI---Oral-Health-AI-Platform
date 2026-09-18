import React, { useState, memo } from 'react';
import {
  User,
  AlertTriangle,
  Copy,
  Check,
  Star,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer.jsx';
import { AudioReader } from './AudioReader.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { stripMarkdown } from '../../utils/textCleaner.js';

export const MessageBubble = memo(({ message, onRate, onViewSource, onRetry, isStreaming = false }) => {
  const { language } = useLanguage();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [showSourcesList, setShowSourcesList] = useState(false);

  const isUser = message.role === 'user';
  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;
  const isWarning = message.warningLevel === 'warning_signs_detected' || message.warningLevel === 'urgent_medical_attention';
  const isPrescriptionRefusal = message.isPrescriptionRefused;

  const handleCopy = () => {
    const raw = message.content || '';
    const cleanText = stripMarkdown(raw);
    navigator.clipboard.writeText(cleanText || raw);
    setCopied(true);
    toast.success('Clean text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-3 sm:gap-4 group ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      } animate-slide-up`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-sm shadow-md shrink-0 select-none ${
          isUser
            ? 'bg-gradient-to-tr from-slate-700 to-slate-900 text-white border border-slate-600'
            : 'bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white border border-teal-400/30 shadow-teal-500/20'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <span className="text-base">🦷</span>}
      </div>

      {/* Bubble Container */}
      <div
        className={`space-y-2 w-full max-w-[92%] sm:max-w-[85%] lg:max-w-[780px] ${
          isUser ? 'items-end ml-auto text-right' : 'items-start text-left'
        }`}
      >
        {/* Main Message Bubble */}
        <div
          className={`p-4 sm:p-5.5 rounded-3xl transition-all shadow-md ${
            isUser
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-sm shadow-teal-600/15'
              : message.isError
              ? 'glass-elevated border-rose-400/40 dark:border-rose-500/30 text-slate-900 dark:text-slate-100 rounded-tl-sm bg-rose-500/5 dark:bg-rose-950/20'
              : (message.safetyAlert || isPrescriptionRefusal)
              ? 'glass-elevated border-rose-400/30 dark:border-rose-500/25 text-slate-900 dark:text-slate-100 rounded-tl-sm'
              : 'glass-elevated border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 rounded-tl-sm'
          }`}
        >
          {isUser ? (
            <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap text-white">
              {message.content}
            </p>
          ) : (
            <div className="space-y-3">
              {/* Integrated Concise Safety Refusal Banner */}
              {(message.safetyAlert || isPrescriptionRefusal) && (
                <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/25 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-snug">
                    {message.safetyAlert || 'Medication and dosage guidance requires a licensed healthcare professional.'}
                  </span>
                </div>
              )}

              {/* Integrated Emergency Warning Banner */}
              {isWarning && (
                <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2.5 shadow-xs">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <span className="leading-snug">
                    Clinical Red Flag: We recommend prompt in-person dental evaluation for worsening symptoms.
                  </span>
                </div>
              )}

              {/* Semantic Markdown Content with redundant heading stripper */}
              <MarkdownRenderer
                content={
                  (message.safetyAlert || isPrescriptionRefusal) && message.content
                    ? message.content.replace(/^###?\s*⚠️?\s*(Prescription|Medication|दवा|औषधोपचार)[^\n]*\n+/i, '').trim()
                    : message.content
                }
              />

              {/* Streaming Blinking Cursor */}
              {isStreaming && (
                <span className="animate-pulse-cursor text-teal-500 font-bold">|</span>
              )}

              {/* Explicit Retry Button on Error */}
              {message.isError && onRetry && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onRetry(message.retryPrompt)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all interactive-scale"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Inquiry</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Embedded Sources Collapsible (if message has RAG sources) */}
        {!isUser && hasSources && (
          <div className="space-y-1.5 pt-0.5">
            <button
              onClick={() => setShowSourcesList(!showSourcesList)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl glass-subtle border border-teal-500/25 text-teal-700 dark:text-teal-300 text-[11px] font-bold hover:border-teal-500/50 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>{message.sources.length} Cited Dental Reference{message.sources.length > 1 ? 's' : ''}</span>
              {showSourcesList ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>

            {showSourcesList && (
              <div className="p-3 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.07] space-y-2 text-xs animate-in fade-in duration-150">
                {message.sources.map((src, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.05] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 truncate">
                        {src.title}
                      </span>
                      {src.category && (
                        <span className="px-1.5 py-0.2 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[9px] font-extrabold uppercase">
                          {src.category}
                        </span>
                      )}
                    </div>
                    {src.organization && (
                      <p className="text-[10px] text-slate-400">
                        Authority: <strong className="text-slate-600 dark:text-slate-300">{src.organization}</strong>
                      </p>
                    )}
                    {src.sourceUrl && (
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline pt-0.5"
                      >
                        <span>Official Source Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assistant Bottom Metadata & Micro Actions */}
        {!isUser && !isStreaming && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="text-[10px] font-medium">
              Educational Assistant • Clinical Guidance
            </span>

            {/* Micro Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* TTS Audio Reader with clean text */}
              <AudioReader text={message.content} language={message.language || language} />

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg glass-subtle text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all interactive-scale"
                title="Copy clean text"
                aria-label="Copy clean text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Feedback Rating */}
              {onRate && (
                <button
                  onClick={() => onRate(message)}
                  className="p-1.5 rounded-lg glass-subtle text-slate-500 hover:text-amber-500 transition-all flex items-center gap-1 interactive-scale"
                  title="Rate response accuracy"
                  aria-label="Rate response accuracy"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
