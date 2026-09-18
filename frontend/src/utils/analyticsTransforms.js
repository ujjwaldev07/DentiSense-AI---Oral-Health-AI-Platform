/**
 * Pure helper utilities for formatting, sanitizing, and transforming healthcare analytics data.
 */

/**
 * Formats ISO dates into friendly human-readable strings.
 * Avoids raw American format "9/3/2026" and gives relative time context.
 */
export const formatFriendlyDate = (dateInput, includeTime = true) => {
  if (!dateInput) return 'Recently';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (isToday) {
    return includeTime ? `Today at ${timeStr}` : 'Today';
  }

  if (isYesterday) {
    return includeTime ? `Yesterday at ${timeStr}` : 'Yesterday';
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  const dateFormatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: isSameYear ? undefined : 'numeric'
  });

  return includeTime ? `${dateFormatted} at ${timeStr}` : dateFormatted;
};

/**
 * Group activities array by friendly date headers ("Today", "Yesterday", "Earlier").
 */
export const groupActivitiesByDate = (activities = []) => {
  const groups = {};

  for (const item of activities) {
    const header = formatFriendlyDate(item.date, false);
    if (!groups[header]) {
      groups[header] = [];
    }
    groups[header].push(item);
  }

  return Object.entries(groups).map(([label, items]) => ({
    label,
    items
  }));
};

/**
 * Sanitizes numeric KPI values to prevent NaN or undefined from leaking into the UI.
 */
export const sanitizeKpi = (val, fallback = 0) => {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return fallback;
  }
  return Number(val);
};

/**
 * Formats a rating value into a clean star display.
 * Returns null or custom placeholder if no real ratings exist.
 */
export const formatRatingDisplay = (rating) => {
  if (rating === null || rating === undefined || isNaN(Number(rating))) {
    return 'No reviews yet';
  }
  return `${Number(rating).toFixed(1)} ★`;
};

/**
 * Format topic name cleanly and avoid excessive clipping.
 */
export const cleanTopicName = (topic) => {
  if (!topic) return 'General Oral Health';
  return topic.replace(/\(.*\)/, '').trim() || topic;
};
