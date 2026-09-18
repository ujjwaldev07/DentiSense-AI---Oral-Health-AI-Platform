/**
 * Utility to parse conversational AI dental responses into a structured JSON representation
 * supporting typed sections (paragraph, bullets, numbered_list, warning, recommendation, table).
 */

export const parseStructuredResponse = (rawContent, options = {}) => {
  const { sources = [], warningLevel = 'none', language = 'en', redFlags = [] } = options;

  if (!rawContent || typeof rawContent !== 'string') {
    return {
      directAnswer: '',
      sections: [],
      sources: sources || [],
      warningLevel,
      safetyNotice: null,
      language
    };
  }

  // Remove trailing disclaimer and references notes for section parsing
  let cleaned = rawContent
    .replace(/\n*---\n*\*?(?:Educational Disclaimer|शैक्षणिक अस्वीकरण|वैद्यकीय अस्वीकरण)[\s\S]*$/i, '')
    .replace(/\n*---\n*\*?Information grounded in verified clinical guidance[\s\S]*$/i, '')
    .trim();

  const lines = cleaned.split('\n');
  let directAnswerLines = [];
  const sections = [];
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is a header (### Header, ### **Header**, or **Header**)
    const isHeader = (
      (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('#### ')) ||
      (trimmed.startsWith('**') && (trimmed.endsWith('**') || trimmed.endsWith('**:')) && !trimmed.includes('\n') && trimmed.length < 80)
    ) && !trimmed.startsWith('* ') && !trimmed.startsWith('- ');

    if (isHeader) {
      if (currentSection) {
        finalizeSection(currentSection, sections);
      }
      const rawTitle = trimmed.replace(/^[#\s*]+/, '').replace(/[*#:\s]+$/, '').trim();
      currentSection = {
        title: rawTitle,
        rawLines: []
      };
    } else if (currentSection) {
      if (trimmed !== '---') {
        currentSection.rawLines.push(line);
      }
    } else {
      if (trimmed !== '---') {
        directAnswerLines.push(line);
      }
    }
  }

  if (currentSection) {
    finalizeSection(currentSection, sections);
  }

  const directAnswer = directAnswerLines.join('\n').trim() || (sections.length > 0 ? sections[0].title : cleaned);

  let safetyNotice = null;
  if (redFlags.length > 0) {
    safetyNotice = redFlags.map(rf => rf.description).join('; ');
  }

  return {
    directAnswer,
    sections,
    sources: sources || [],
    warningLevel,
    safetyNotice,
    language
  };
};

function finalizeSection(sec, sectionsList) {
  const text = sec.rawLines.join('\n').trim();
  if (!text) return;

  const contentLines = sec.rawLines
    .map(l => l.trim())
    .filter(l => Boolean(l) && l !== '---');

  if (contentLines.length === 0) return;

  // Check if bullet list
  const isBulletList = contentLines.every(l => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('• '));
  if (isBulletList && contentLines.length > 0) {
    sectionsList.push({
      title: sec.title,
      type: 'bullets',
      items: contentLines.map(l => l.replace(/^[-*•]\s*/, '').trim())
    });
    return;
  }

  // Check if numbered list
  const isNumberedList = contentLines.every(l => /^\d+\.\s+/.test(l));
  if (isNumberedList && contentLines.length > 0) {
    sectionsList.push({
      title: sec.title,
      type: 'numbered_list',
      items: contentLines.map(l => l.replace(/^\d+\.\s*/, '').trim())
    });
    return;
  }

  // Check if warning / emergency section
  const lowerTitle = sec.title.toLowerCase();
  if (lowerTitle.includes('warning') || lowerTitle.includes('emergency') || lowerTitle.includes('चेतावनी') || lowerTitle.includes('धोका')) {
    sectionsList.push({
      title: sec.title,
      type: 'warning',
      text
    });
    return;
  }

  // Check if recommendation section
  if (lowerTitle.includes('when to') || lowerTitle.includes('consult') || lowerTitle.includes('see a dentist') || lowerTitle.includes('सलाह')) {
    sectionsList.push({
      title: sec.title,
      type: 'recommendation',
      text
    });
    return;
  }

  // Default to standard paragraph section
  sectionsList.push({
    title: sec.title,
    type: 'paragraph',
    text
  });
}
