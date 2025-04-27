
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Page non trouvée:",
      location.pathname,
      "- Assurez-vous que cette route est définie dans App.tsx"
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-app-blue">404</h1>
        <p className="text-xl text-gray-600 mb-4">Page non trouvée</p>
        <p className="text-gray-500 mb-6">
          La page <code className="bg-gray-100 p-1 rounded">{location.pathname}</code> n'existe pas.
        </p>
        <div className="flex flex-col space-y-3">
          <Link to="/" className="text-white bg-app-blue px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            Retour à l'accueil
          </Link>
          <Link to="/verification-routes" className="text-app-blue hover:underline">
            Aller à la vérification des routes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
