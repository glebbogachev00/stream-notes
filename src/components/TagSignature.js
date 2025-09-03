import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getUserTag, formatUserTag } from '../utils/tags';

const TagSignature = ({ className = '' }) => {
  const { theme } = useTheme();
  const [currentUserTag, setCurrentUserTag] = useState(getUserTag());

  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUserTag(getUserTag());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!currentUserTag) return null;

  return (
    <span className={`${theme.textSecondary} ${className}`}>
      {formatUserTag(currentUserTag)}
    </span>
  );
};

export default TagSignature;