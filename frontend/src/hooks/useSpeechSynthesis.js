import { useState, useEffect, useCallback } from 'react';

// Strips markdown headers, stars, and bullet characters for clean speech
const cleanMarkdownForSpeech = (markdownText) => {
  if (!markdownText) return '';
  return markdownText
    .replace(/###/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[-_]{3,}/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[⚠️🚨💡🔍🛡️📋]/g, '')
    .trim();
};

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasSupport, setHasSupport] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setHasSupport(true);
    }
  }, []);

  const speak = useCallback((rawText, language = 'en') => {
    if (!hasSupport || !window.speechSynthesis) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const plainText = cleanMarkdownForSpeech(rawText);
    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);

    // Set voice language
    const langMap = {
      hi: 'hi-IN',
      mr: 'mr-IN',
      en: 'en-US'
    };
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.includes(utterance.lang) || v.lang.startsWith(language));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [hasSupport]);

  const stop = useCallback(() => {
    if (hasSupport && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [hasSupport]);

  const pause = useCallback(() => {
    if (hasSupport && window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [hasSupport, isSpeaking]);

  const resume = useCallback(() => {
    if (hasSupport && window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [hasSupport, isPaused]);

  return {
    isSpeaking,
    isPaused,
    hasSupport,
    speak,
    stop,
    pause,
    resume
  };
};
