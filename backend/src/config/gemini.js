import { GoogleGenAI } from '@google/genai';
import { ENV } from './env.js';

let geminiClient = null;

export const getGeminiClient = () => {
  if (!ENV.GEMINI_API_KEY) {
    return null;
  }

  if (!geminiClient) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: ENV.GEMINI_API_KEY
      });
      console.log('🤖 Google Gemini Client initialized successfully with model:', ENV.GEMINI_MODEL);
    } catch (error) {
      console.error('❌ Failed to initialize Google GenAI Client:', error.message);
      return null;
    }
  }

  return geminiClient;
};

export const hasGeminiApiKey = () => {
  return Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim().length > 0);
};
