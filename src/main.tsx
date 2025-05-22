
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Composant App simple par défaut
const App = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Qualite.cloud</h1>
        <p className="text-gray-600">Système de Management de la Qualité</p>
      </header>
      <main>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bienvenue</h2>
          <p>Cette application est en cours de chargement ou de déploiement.</p>
          <p className="mt-4">Si vous voyez cette page, le déploiement de base a réussi mais l'application complète n'est pas encore chargée.</p>
        </div>
      </main>
    </div>
  );
};

try {
  console.log("Application starting...");
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>L\'élément racine est introuvable.</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log("Application mounted successfully");
  }
} catch (error) {
  console.error("Failed to render application:", error);
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  document.body.innerHTML = `<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>${message}</p></div>`;
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});
