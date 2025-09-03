import { sanitizeInput, validateStorageData } from './security';

const USER_TAG_KEY = 'stream_user_tag';
const TAG_DETECTION_REGEX = /\[([^\]]+)\]©/g;

const validateUserTag = (tagName) => {
  if (!tagName || typeof tagName !== 'string') return false;
  
  const cleaned = tagName.trim().toLowerCase();
  
  if (cleaned.length < 2 || cleaned.length > 15) return false;
  
  return /^[a-z0-9_-]+$/.test(cleaned);
};

const setUserTag = (tagName) => {
  const sanitized = sanitizeInput(tagName);
  
  if (!validateUserTag(sanitized)) {
    throw new Error('Invalid tag name. Use only letters, numbers, hyphens, and underscores (2-15 characters).');
  }
  
  const tagData = {
    name: sanitized.toLowerCase(),
    createdAt: Date.now()
  };
  
  localStorage.setItem(USER_TAG_KEY, JSON.stringify(tagData));
  return tagData;
};

const getUserTag = () => {
  try {
    const stored = localStorage.getItem(USER_TAG_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    if (!validateStorageData(parsed, ['name', 'createdAt'])) {
      localStorage.removeItem(USER_TAG_KEY);
      return null;
    }
    
    return parsed;
  } catch (error) {
    localStorage.removeItem(USER_TAG_KEY);
    return null;
  }
};

const hasUserTag = () => {
  return getUserTag() !== null;
};

const formatUserTag = (tagData) => {
  if (!tagData) return '';
  return `[${tagData.name}]©`;
};

const extractTagsFromContent = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const matches = content.match(TAG_DETECTION_REGEX);
  if (!matches) return [];
  
  return matches.map(match => {
    const tagName = match.slice(1, -2);
    return {
      name: sanitizeInput(tagName),
      fullTag: match
    };
  });
};

const clearUserTag = () => {
  localStorage.removeItem(USER_TAG_KEY);
};

export {
  setUserTag,
  getUserTag,
  hasUserTag,
  formatUserTag,
  extractTagsFromContent,
  validateUserTag,
  clearUserTag,
  TAG_DETECTION_REGEX
};