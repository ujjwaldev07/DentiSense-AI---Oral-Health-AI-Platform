/**
 * Utility to strip markdown formatting characters to produce clean, readable plain text.
 * Used for TTS speech synthesis and clean clipboard copying.
 */
export const stripMarkdown = (markdownText) => {
  if (!markdownText || typeof markdownText !== 'string') return '';

  let text = markdownText;

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');

  // Replace headers (e.g. ### Header -> Header)
  text = text.replace(/^#{1,6}\s+(.*)$/gm, '$1');

  // Remove bold and italic (e.g. **bold**, *italic*, __bold__, _italic_)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // Remove strikethrough (e.g. ~~strike~~)
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Remove blockquotes (e.g. > quote)
  text = text.replace(/^\s*>\s+/gm, '');

  // Replace horizontal rules (e.g. --- or ***) with empty string
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // Replace markdown links [text](url) with just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Replace bullet points (- or * or +) with a clean bullet symbol or space
  text = text.replace(/^\s*[-*+]\s+/gm, '• ');

  // Clean excessive blank lines (more than 2 -> 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
};
