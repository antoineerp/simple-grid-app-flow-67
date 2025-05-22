
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

// Définir les composants pour notre application
const Home = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">Qualite.cloud</h1>
        <p className="text-gray-600">Système de Management de la Qualité</p>
      </header>
      <main>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Bienvenue</h2>
          <p>Notre application de gestion de la qualité est en cours de démarrage.</p>
          <div className="mt-6">
            <h3 className="font-medium text-lg mb-2">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
              </li>
              <li>
                <a href="/diagnostic" className="text-blue-600 hover:underline">Diagnostic</a>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Dashboard</h1>
        <a href="/" className="text-blue-600 hover:underline">Retour à l'accueil</a>
      </header>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Tableau de bord</h2>
        <p>Cette fonctionnalité est en cours de développement.</p>
      </div>
    </div>
  );
};

const Diagnostic = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Diagnostic</h1>
        <a href="/" className="text-blue-600 hover:underline">Retour à l'accueil</a>
      </header>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">État du système</h2>
        <div className="space-y-4">
          <div className="p-3 bg-green-100 border-l-4 border-green-500">
            <p className="font-medium">Application React chargée avec succès</p>
          </div>
          <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500">
            <p className="font-medium">API PHP non disponible</p>
            <p className="text-sm mt-2">Les fichiers PHP sont renvoyés en texte brut. Vérifiez la configuration du serveur.</p>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium text-lg">Solutions recommandées</h3>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Vérifiez que le serveur web est correctement configuré pour exécuter les fichiers PHP</li>
            <li>Assurez-vous que l'extension PHP est activée sur le serveur</li>
            <li>Vérifiez les droits d'accès des fichiers PHP</li>
            <li>Consultez le fichier .htaccess pour s'assurer qu'il n'interfère pas avec l'exécution PHP</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const NotFound = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Page non trouvée</h1>
        <p className="mb-4">La page que vous recherchez n'existe pas.</p>
        <a href="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
};

// Définir les routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <NotFound />
  },
  {
    path: "/dashboard",
    element: <Dashboard />
  },
  {
    path: "/diagnostic",
    element: <Diagnostic />
  }
]);

// Création d'un fichier index.css minimal si nécessaire
try {
  console.log("Application starting...");
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error("Root element not found!");
    document.body.innerHTML = '<div style="text-align:center; padding:20px;"><h1>Erreur</h1><p>L\'élément racine est introuvable.</p></div>';
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <RouterProvider router={router} />
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
