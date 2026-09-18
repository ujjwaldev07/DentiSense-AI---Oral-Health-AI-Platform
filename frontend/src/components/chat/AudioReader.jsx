import React from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js';
import { stripMarkdown } from '../../utils/textCleaner.js';

export const AudioReader = ({ text, language = 'en' }) => {
  const { isSpeaking, isPaused, hasSupport, speak, stop, pause, resume } = useSpeechSynthesis();

  if (!hasSupport || !text) return null;

  const handleToggle = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      // Strip markdown syntax so speech synthesis engine reads natural clean text
      const cleanText = stripMarkdown(text);
      speak(cleanText, language);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shadow-2xs">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold transition-colors"
        title={isSpeaking ? (isPaused ? 'Resume audio' : 'Pause audio') : 'Listen to audio response (TTS)'}
        aria-label={isSpeaking ? (isPaused ? 'Resume audio' : 'Pause audio') : 'Listen to audio response (TTS)'}
      >
        {isSpeaking ? (
          isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        <span>{isSpeaking ? (isPaused ? 'Paused' : 'Playing...') : 'Listen'}</span>
      </button>

      {isSpeaking && (
        <button
          onClick={stop}
          className="text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 ml-1 p-0.5 rounded-full hover:bg-rose-500/10 transition-colors"
          title="Stop playback"
          aria-label="Stop playback"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
