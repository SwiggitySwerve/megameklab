/**
 * TabContentWrapper - Standardized container for tab content with consistent scrolling
 * 
 * This component ensures all tabs have:
 * - Consistent height calculation
 * - Proper scrolling behavior
 * - Standardized scrollbar styling
 * - Responsive design support
 */

import React from 'react';
import { TAB_CONTENT_HEIGHT, SCROLLBAR_CLASSES } from '../../utils/layout/constants';

interface TabContentWrapperProps {
  /** Content to be rendered inside the scrollable container */
  children: React.ReactNode;
  
  /** Additional CSS classes to apply to the container */
  className?: string;
  
  /** Background color override (defaults to slate-900) */
  backgroundColor?: string;
  
  /** Whether to apply padding to the content (defaults to false) */
  withPadding?: boolean;
  
  /** Custom padding amount if withPadding is true */
  padding?: string;
}

/**
 * Standardized tab content wrapper that provides:
 * - Calculated height to fill available viewport space
 * - Consistent scrolling behavior
 * - Proper scrollbar styling
 * - Background color management
 */
export const TabContentWrapper: React.FC<TabContentWrapperProps> = ({
  children,
  className = '',
  backgroundColor = 'bg-slate-900',
  withPadding = false,
  padding = 'p-4'
}) => {
  const baseClasses = `overflow-auto ${SCROLLBAR_CLASSES} ${backgroundColor}`;
  const paddingClasses = withPadding ? padding : '';
  const finalClasses = `${baseClasses} ${paddingClasses} ${className}`.trim();

  return (
    <div 
      className={finalClasses}
      style={{ height: TAB_CONTENT_HEIGHT }}
      role="tabpanel"
      aria-label="Tab content"
    >
      {children}
    </div>
  );
};

/**
 * Alternative wrapper for tabs that need custom height calculations
 * Use this only when the standard height doesn't work for specific use cases
 */
export const CustomHeightTabWrapper: React.FC<{
  children: React.ReactNode;
  height: string;
  className?: string;
}> = ({ children, height, className = '' }) => {
  return (
    <div 
      className={`overflow-auto ${SCROLLBAR_CLASSES} bg-slate-900 ${className}`}
      style={{ height }}
      role="tabpanel"
      aria-label="Tab content"
    >
      {children}
    </div>
  );
};

export default TabContentWrapper;
