
/**
 * Utility for error logging and management
 */

// Correctly type errorLogs in the global Window interface
declare global {
  interface Window {
    errorLogs: string[];
  }
}

// Initialize error logs on the window object
export const initializeErrorLogging = (): void => {
  if (typeof window !== 'undefined') {
    // Create an array for error logs if it doesn't already exist
    if (!window.errorLogs) {
      window.errorLogs = [];
    }
    
    // Override console.error to capture authentication errors
    const originalError = console.error;
    console.error = function() {
      // Store the error in our log
      if (window.errorLogs) {
        window.errorLogs.unshift(Array.from(arguments).join(' '));
        // Trim the log to prevent memory issues
        if (window.errorLogs.length > 100) {
          window.errorLogs = window.errorLogs.slice(0, 100);
        }
      }
      // Call the original console.error
      return originalError.apply(console, arguments);
    };
  }
};

// Check if there's an authentication error in recent logs
export const hasAuthenticationError = (): boolean => {
  if (typeof window === 'undefined' || !window.errorLogs) return false;
  
  return window.errorLogs.some(log => 
    typeof log === 'string' && 
    (log.includes('authentifi') || 
     log.includes('auth') || 
     log.includes('token') || 
     log.includes('permission'))
  );
};

// Get all recent errors
export const getRecentErrors = (): string[] => {
  if (typeof window === 'undefined') return [];
  return window.errorLogs || [];
};
