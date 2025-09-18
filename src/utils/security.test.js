
import { 
  sanitizeInput, 
  validateTagName, 
  sanitizeNoteContent, 
  validateStorageData 
} from './security';

describe('security utility', () => {

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle empty and non-string inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput(123)).toBe('');
    });
  });

  describe('validateTagName', () => {
    it('should return true for valid tag names', () => {
      expect(validateTagName('valid-tag')).toBe(true);
      expect(validateTagName('Tag_123')).toBe(true);
    });

    it('should return false for invalid tag names', () => {
      expect(validateTagName('a')).toBe(false); // too short
      expect(validateTagName('a-very-long-tag-name-that-is-not-valid')).toBe(false); // too long
      expect(validateTagName('invalid tag')).toBe(false); // contains space
      expect(validateTagName('invalid!@#')).toBe(false); // contains special chars
    });
  });

  describe('sanitizeNoteContent', () => {
    it('should remove script tags', () => {
      const content = 'Hello <script>alert("XSS")</script> world';
      const sanitized = sanitizeNoteContent(content);
      expect(sanitized).toBe('Hello  world');
    });

    it('should remove javascript: links', () => {
      const content = "A <a href=\"javascript:alert('XSS')\">link</a>";
      const sanitized = sanitizeNoteContent(content);
      expect(sanitized).toBe('A <a href="">link</a>');
    });

    it('should remove event handlers', () => {
      const content = "<div onclick=\"alert('XSS')\">Click me</div>";
      const sanitized = sanitizeNoteContent(content);
      expect(sanitized).toBe('<div >Click me</div>');
    });

    it('should handle complex XSS attempts', () => {
      const content = "<img src=\"x\" onerror=\"alert('XSS')\"> <script src=\"http://evil.com/xss.js\"></script>";
      const sanitized = sanitizeNoteContent(content);
      expect(sanitized).toBe('<img src="x" > ');
    });
  });

  describe('validateStorageData', () => {
    it('should return true if all keys exist', () => {
      const data = { name: 'test', color: '#fff', createdAt: 123 };
      const keys = ['name', 'color', 'createdAt'];
      expect(validateStorageData(data, keys)).toBe(true);
    });

    it('should return false if any key is missing', () => {
      const data = { name: 'test', color: '#fff' };
      const keys = ['name', 'color', 'createdAt'];
      expect(validateStorageData(data, keys)).toBe(false);
    });

    it('should return false for invalid data types', () => {
      expect(validateStorageData(null, ['key'])).toBe(false);
      expect(validateStorageData('string', ['key'])).toBe(false);
    });

    it('should return true if no keys are expected', () => {
      const data = { any: 'data' };
      expect(validateStorageData(data, [])).toBe(true);
    });
  });

});
