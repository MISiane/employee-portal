import DOMPurify from 'dompurify';

// Announcement content is rich text (HTML) written in the Quill editor.
// Always run it through this before putting it into dangerouslySetInnerHTML.
export const sanitizeHtml = (html) =>
  DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true } });

const escapeHtml = (text) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Plain-text version of an HTML string (tags removed).
export const htmlToText = (html) => {
  const doc = new DOMParser().parseFromString(sanitizeHtml(html), 'text/html');
  return (doc.body.textContent || '').trim();
};

// Safe HTML for list previews. Short content keeps its formatting; long content
// is cut as plain text (escaped), so a cut can never leave a half-open tag.
export const previewHtml = (html, maxLength) => {
  const text = htmlToText(html);
  if (text.length <= maxLength) return sanitizeHtml(html);
  return `${escapeHtml(text.substring(0, maxLength))}...`;
};
