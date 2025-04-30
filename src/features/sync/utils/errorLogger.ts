
/**
 * Utility for error logging and management
 */

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
  return window.errorLogs && 
    window.errorLogs.some(log => 
      typeof log === 'string' && 
      (log.includes('authentifi') || 
       log.includes('auth') || 
       log.includes('token') || 
       log.includes('permission'))
    );
};

// Get all recent errors
export const getRecentErrors = (): string[] => {
  return window.errorLogs || [];
};
