
import { 
  validateUserTag, 
  generateTagColor, 
  formatUserTag, 
  extractTagsFromContent,
  setUserTag,
  getUserTag,
  clearUserTag
} from './tags';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('tags utility', () => {

  describe('validateUserTag', () => {
    it('should return true for valid tags', () => {
      expect(validateUserTag('valid-tag')).toBe(true);
      expect(validateUserTag('tag_123')).toBe(true);
      expect(validateUserTag('another')).toBe(true);
    });

    it('should return false for invalid tags', () => {
      expect(validateUserTag('a')).toBe(false); // too short
      expect(validateUserTag('this-is-a-very-long-tag-name')).toBe(false); // too long
      expect(validateUserTag('invalid tag')).toBe(false); // contains space
      expect(validateUserTag('invalid!@#')).toBe(false); // contains special chars
      expect(validateUserTag('')).toBe(false);
      expect(validateUserTag(null)).toBe(false);
      expect(validateUserTag(undefined)).toBe(false);
    });
  });

  describe('generateTagColor', () => {
    it('should generate a deterministic color', () => {
      const color1 = generateTagColor('my-tag');
      const color2 = generateTagColor('my-tag');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different tags', () => {
      const color1 = generateTagColor('tag-one');
      const color2 = generateTagColor('tag-two');
      expect(color1).not.toBe(color2);
    });

    it('should return a valid hex color string', () => {
      const color = generateTagColor('any-tag');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('formatUserTag', () => {
    it('should format a tag object into a string', () => {
      const tagData = { name: 'my-tag' };
      expect(formatUserTag(tagData)).toBe('[my-tag]©');
    });

    it('should return an empty string for null input', () => {
      expect(formatUserTag(null)).toBe('');
    });
  });

  describe('extractTagsFromContent', () => {
    



    it('should return an empty array if no tags are found', () => {
      const content = 'This is a note with no tags.';
      const tags = extractTagsFromContent(content);
      expect(tags).toHaveLength(0);
    });
  });

  describe('localStorage functions', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

    it('should set and get a user tag', () => {
      const tagName = 'test-user';
      setUserTag(tagName);
      const storedTag = getUserTag();
      expect(storedTag).not.toBeNull();
      expect(storedTag.name).toBe(tagName);
      expect(storedTag.color).toBe(generateTagColor(tagName));
    });

    it('should throw an error for an invalid tag name on set', () => {
      const tagName = 'invalid tag';
      expect(() => setUserTag(tagName)).toThrow();
    });

    it('should clear a user tag', () => {
      setUserTag('test-user');
      let storedTag = getUserTag();
      expect(storedTag).not.toBeNull();
      clearUserTag();
      storedTag = getUserTag();
      expect(storedTag).toBeNull();
    });

    it('should return null if stored tag data is invalid', () => {
      localStorage.setItem('stream_user_tag', JSON.stringify({ name: 'incomplete' }));
      const storedTag = getUserTag();
      expect(storedTag).toBeNull();
    });
  });
});
