
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: Page non trouvée:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-6xl font-bold mb-4 text-app-blue">404</h1>
        <p className="text-xl text-gray-700 mb-4">Page non trouvée</p>
        <p className="text-gray-600 mb-6">
          L'URL <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code> n'existe pas dans l'application.
        </p>
        <Button asChild className="flex items-center justify-center gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
