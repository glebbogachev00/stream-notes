// Utility functions for textarea editing and cursor management

export const autoResize = (textarea) => {
  if (!textarea) return;
  
  // Store current scroll position to prevent jumps
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  // Temporarily set height to auto to get the correct scrollHeight
  const currentHeight = textarea.style.height;
  textarea.style.height = 'auto';
  const newHeight = `${textarea.scrollHeight}px`;
  
  // Only update if height actually changed to avoid unnecessary reflows
  if (newHeight !== currentHeight) {
    textarea.style.height = newHeight;
  }
  
  // Restore scroll position if it changed unexpectedly
  requestAnimationFrame(() => {
    const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(newScrollTop - scrollTop) > 2) {
      window.scrollTo(0, scrollTop);
    }
  });
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
  
  // Store cursor position and scroll state
  const cursorStart = textarea.selectionStart;
  const cursorEnd = textarea.selectionEnd;
  
  // Update content
  callback(value);
  
  // Use requestAnimationFrame for smooth updates
  requestAnimationFrame(() => {
    // Auto-resize without causing scroll jumps
    autoResize(textarea);
    
    // Restore cursor position
    try {
      if (textarea.setSelectionRange) {
        textarea.setSelectionRange(cursorStart, cursorEnd);
      }
    } catch (e) {
      // Fallback if cursor restoration fails
      textarea.focus();
    }
  });
};

export const setupTextareaForEditing = (textarea) => {
  if (!textarea) return;
  
  // Use requestAnimationFrame to ensure smooth setup
  requestAnimationFrame(() => {
    // Auto-resize to fit content first
    autoResize(textarea);
    
    // Focus and position cursor at end
    textarea.focus();
    
    // Set cursor to end of content
    const length = textarea.value.length;
    try {
      textarea.setSelectionRange(length, length);
    } catch (e) {
      // Fallback for cursor positioning
      textarea.focus();
    }
  });
};

export const handleTextareaClick = (event) => {
  // Ensure click events position cursor correctly
  event.stopPropagation();
  // Let the browser handle the click naturally for cursor positioning
};

export const handleTextareaKeyDown = (event, onSave) => {
  // Prevent form submission on Enter in some browsers
  if (event.key === 'Enter' && event.target.form) {
    // Allow normal Enter behavior for line breaks, but prevent form submission
    event.stopPropagation();
  }
  
  // Handle keyboard shortcuts
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    if (onSave) onSave();
    return;
  }
  
  // Prevent default behavior for keys that might cause page scrolling
  if (event.key === 'Escape') {
    event.preventDefault();
    if (onSave) onSave();
    return;
  }
  
  // Auto-resize on key input with smooth animation
  requestAnimationFrame(() => {
    autoResize(event.target);
  });
};