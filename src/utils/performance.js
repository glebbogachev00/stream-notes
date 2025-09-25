// Performance utilities for optimizing the app

// Lazy loading utilities
export const preloadComponent = (importFunction) => {
  const componentImport = importFunction();
  return componentImport;
};

// Preload components on hover for better UX
export const preloadOnHover = (importFunction) => {
  let preloadPromise = null;
  
  return {
    onMouseEnter: () => {
      if (!preloadPromise) {
        preloadPromise = importFunction();
      }
    },
    preload: () => {
      if (!preloadPromise) {
        preloadPromise = importFunction();
      }
      return preloadPromise;
    }
  };
};

// Image optimization utilities
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    format = 'webp',
    quality = 80,
    fallback = true
  } = options;

  // For future implementation with image optimization service
  return {
    src,
    srcSet: `${src}?w=${width}&h=${height}&f=${format}&q=${quality}`,
    fallbackSrc: fallback ? src : null
  };
};

// Memory optimization utilities
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Critical CSS extraction helper
export const extractCriticalCSS = () => {
  const criticalSelectors = [
    '.min-h-screen',
    '.max-w-2xl',
    '.mx-auto',
    '.px-4',
    '.py-8',
    '.text-base',
    '.font-light',
    '.transition-all',
    '.duration-200'
  ];
  
  return criticalSelectors.map(selector => {
    const elements = document.querySelectorAll(selector);
    return elements.length > 0 ? selector : null;
  }).filter(Boolean);
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      available: false,
      reason: 'Bundle analysis available in production build only'
    };
  }
  
  // This would integrate with webpack-bundle-analyzer
  return {
    available: true,
    chunks: window.__webpack_require__ ? Object.keys(window.__webpack_require__.cache) : [],
    timestamp: Date.now()
  };
};
