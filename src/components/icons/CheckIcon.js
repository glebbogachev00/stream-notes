import React from 'react';

const CheckIcon = ({ size = '1.1em', className = '', strokeWidth = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

export default CheckIcon;