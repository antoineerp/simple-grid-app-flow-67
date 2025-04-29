
// Main entry point for the application
// This file provides a fallback for browsers that might have issues with direct ES imports
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('DOMContentLoaded', () => {
  try {
    console.log("Application initialization started");
    const rootElement = document.getElementById("root");
    
    if (rootElement) {
      console.log("Root element found, starting React rendering");
      const root = createRoot(rootElement);
      root.render(React.createElement(App));
      
      console.log("Application rendering successfully started");
    } else {
      console.error("Root element not found");
    }
  } catch (error) {
    console.error("Failed to render React application:", error);
  }
});
