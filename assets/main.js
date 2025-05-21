
// Fallback main.js for the assets directory
// This file provides basic functionality when the build system's output isn't available

console.log("Fallback main.js loaded from assets directory");

// Define async function to load React from CDN
const loadReactFromCDN = async () => {
  return new Promise((resolve) => {
    // Create script elements for React
    const reactScript = document.createElement('script');
    reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
    reactScript.crossOrigin = '';
    
    // Create script elements for ReactDOM
    const reactDOMScript = document.createElement('script');
    reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
    reactDOMScript.crossOrigin = '';
    
    // Handle successful load
    reactDOMScript.onload = () => {
      console.log("React loaded from CDN");
      resolve();
    };
    
    // Handle errors
    reactScript.onerror = reactDOMScript.onerror = () => {
      console.error("Failed to load React from CDN");
      // Continue anyway, we'll display an error message
      resolve();
    };
    
    // Add scripts to body
    document.body.appendChild(reactScript);
    document.body.appendChild(reactDOMScript);
  });
};

// Simple rendering function
const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found");
    return;
  }
  
  try {
    if (window.React && window.ReactDOM) {
      // If React is available, create a simple React app
      const element = React.createElement(
        'div',
        { style: { textAlign: 'center', padding: '2rem' } },
        React.createElement('h1', null, 'Application en cours de chargement'),
        React.createElement('p', null, 'Veuillez patienter pendant que nous chargeons les ressources nécessaires...'),
        React.createElement('button', { 
          onClick: () => window.location.reload(),
          style: { 
            padding: '0.5rem 1rem', 
            background: '#4a6cf7', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }
        }, 'Rafraîchir')
      );
      
      ReactDOM.render(element, rootElement);
    } else {
      // Fallback to simple HTML
      rootElement.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <h1>Application en cours de chargement</h1>
          <p>Veuillez patienter pendant que nous chargeons les ressources nécessaires...</p>
          <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Rafraîchir
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error rendering app:", error);
    rootElement.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>Erreur de chargement</h1>
        <p>L'application n'a pas pu être chargée correctement.</p>
        <p>Erreur: ${error.message || 'Erreur inconnue'}</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #4a6cf7; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
  }
};

// Main execution
(async function() {
  try {
    console.log("Initializing application from fallback main.js");
    
    // Try to load React from CDN
    await loadReactFromCDN();
    
    // Render the app
    renderApp();
    
    // Try to load the main app bundle (as a module now)
    const appScript = document.createElement('script');
    appScript.src = '/src/main.tsx';
    appScript.type = 'module';
    appScript.onerror = (error) => {
      console.error("Failed to load main app bundle:", error);
    };
    document.body.appendChild(appScript);
    
  } catch (error) {
    console.error("Critical error in fallback main.js:", error);
  }
})();
