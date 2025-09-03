const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

const validateTagName = (tagName) => {
  if (!tagName || typeof tagName !== 'string') return false;
  
  const cleaned = tagName.trim();
  
  if (cleaned.length < 2 || cleaned.length > 20) return false;
  
  return /^[a-zA-Z0-9_-]+$/.test(cleaned);
};

const sanitizeNoteContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

const validateStorageData = (data, expectedKeys = []) => {
  if (!data || typeof data !== 'object') return false;
  
  if (expectedKeys.length > 0) {
    return expectedKeys.every(key => key in data);
  }
  
  return true;
};

export {
  sanitizeInput,
  validateTagName,
  sanitizeNoteContent,
  validateStorageData
};