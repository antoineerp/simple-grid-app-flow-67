
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { logEnvironmentInfo, isInfomaniakEnvironment, isLovableDomain } from './utils/environment';

// Define window properties for TypeScript
declare global {
  interface Window {
    __LOVABLE_EDITOR__: any;
    __WS_TOKEN__?: string;
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // Ne pas logger les erreurs de ressources Lovable sur Infomaniak
  if (isInfomaniakEnvironment() && 
      event.filename && (event.filename.includes('gpteng.co') || 
                        event.filename.includes('lovable'))) {
    return;
  }
  
  if (event.filename) {
    console.warn(`Resource loading error: ${event.filename}`);
  }
});

// Start the app when DOM is ready
function startApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  try {
    // Log environment info at startup
    logEnvironmentInfo();
    
    // Initialize required globals only if on Lovable domain
    if (isLovableDomain()) {
      if (typeof window.__LOVABLE_EDITOR__ === 'undefined') {
        window.__LOVABLE_EDITOR__ = null;
      }

      if (typeof window.__WS_TOKEN__ === 'undefined') {
        window.__WS_TOKEN__ = 'lovable-ws-token';
      }
    }
    
    console.log("Creating React root");
    const root = createRoot(rootElement);
    
    console.log("Rendering React application");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    console.log("Application rendered successfully");
  } catch (error) {
    console.error("Error rendering application:", error);
    
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="text-align:center; margin-top:50px; font-family:sans-serif;">
          <h1>Loading Error</h1>
          <p>The application could not be loaded correctly.</p>
          <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; cursor:pointer;">
            Try Again
          </button>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
