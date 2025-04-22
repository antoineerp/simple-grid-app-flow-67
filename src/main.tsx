
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

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
  
  if (event.filename && (event.filename.includes('googleapis.com') || 
                        event.filename.includes('gpteng.co') || 
                        event.filename.includes('firestore'))) {
    console.warn(`External resource loading error: ${event.filename}`);
    console.log("This might be related to a script blocker or firewall");
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
    // Initialize required globals
    if (typeof window.__LOVABLE_EDITOR__ === 'undefined') {
      window.__LOVABLE_EDITOR__ = null;
    }

    if (typeof window.__WS_TOKEN__ === 'undefined') {
      window.__WS_TOKEN__ = 'lovable-ws-token';
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

