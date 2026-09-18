import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition.js';

export const VoiceInput = ({ language = 'en', onTranscript, disabled = false }) => {
  const { isListening, hasSupport, startListening, stopListening, error } = useVoiceRecognition({
    language,
    onResult: (text) => {
      if (onTranscript) {
        onTranscript(text);
      }
    }
  });

  const handleToggle = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!hasSupport) {
    return (
      <button
        type="button"
        disabled
        className="p-2.5 rounded-xl text-slate-300 dark:text-slate-600 cursor-not-allowed"
        title="Voice recognition not supported in this browser"
      >
        <MicOff className="w-4 h-4" />
      </button>
    );
  }

  const langLabel = language === 'hi' ? 'Hindi (हिंदी)' : language === 'mr' ? 'Marathi (मराठी)' : 'English';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={isListening ? 'Stop voice recording' : `Voice input in ${langLabel}`}
        className={`p-2.5 rounded-xl transition-all duration-200 ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 voice-recording-pulse'
            : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 hover:bg-teal-500/10'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={isListening ? 'Click to stop listening' : `Click to speak in ${langLabel}`}
      >
        {isListening ? (
          <Mic className="w-4 h-4 animate-pulse" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Visual Listening State Floating Pill */}
      {isListening && (
        <span
          role="status"
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-rose-600 text-[10px] font-extrabold text-white shadow-md animate-bounce"
        >
          Listening ({langLabel.split(' ')[0]})...
        </span>
      )}
    </div>
  );
};
