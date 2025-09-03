// Utility functions for textarea editing and cursor management

export const autoResize = (textarea) => {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export const preserveCursorPosition = (element, callback) => {
  if (!element) return;
  const start = element.selectionStart;
  const end = element.selectionEnd;
  callback();
  // Use requestAnimationFrame to ensure DOM updates are complete
  requestAnimationFrame(() => {
    try {
      element.setSelectionRange(start, end);
    } catch (e) {
      // Fallback if setSelectionRange fails
      element.focus();
    }
  });
};

export const handleTextareaChange = (event, callback) => {
  const textarea = event.target;
  const value = textarea.value;
  
  preserveCursorPosition(textarea, () => {
    callback(value);
    autoResize(textarea);
  });
};

export const setupTextareaForEditing = (textarea) => {
  if (!textarea) return;
  
  // Focus and position cursor at end initially
  textarea.focus();
  
  // Auto-resize to fit content
  autoResize(textarea);
  
  // Set cursor to end of content
  const length = textarea.value.length;
  textarea.setSelectionRange(length, length);
};

export const handleTextareaClick = (event) => {
  // Ensure click events position cursor correctly
  event.stopPropagation();
  // Let the browser handle the click naturally for cursor positioning
};

export const handleTextareaKeyDown = (event, onSave) => {
  // Handle keyboard shortcuts
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    if (onSave) onSave();
  }
  
  // Auto-resize on key input
  requestAnimationFrame(() => {
    autoResize(event.target);
  });
};