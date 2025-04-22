
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

// Initialize required globals
if (typeof window.__LOVABLE_EDITOR__ === 'undefined') {
  window.__LOVABLE_EDITOR__ = null;
}

if (typeof window.__WS_TOKEN__ === 'undefined') {
  window.__WS_TOKEN__ = 'lovable-ws-token';
}

// Start the application
function startApp() {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Error rendering application:", error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
