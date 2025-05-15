
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getApiUrl } from "@/config/apiConfig";

const NotFound = () => {
  const location = useLocation();
  const [isApiPath, setIsApiPath] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  
  useEffect(() => {
    console.error(
      "404 Error: Page non trouvée:",
      location.pathname
    );
    
    // Vérifier si c'est une route d'API
    const isApiRoute = location.pathname.startsWith('/api');
    setIsApiPath(isApiRoute);
    
    // Stocker l'URL de base de l'API
    setApiBaseUrl(getApiUrl());
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-app-blue mb-4">404</h1>
          <p className="text-xl text-gray-600">Page non trouvée</p>
          <p className="text-gray-500 mt-2">L'URL demandée n'existe pas sur ce serveur</p>
        </div>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>URL non trouvée</AlertTitle>
          <AlertDescription className="font-mono text-xs break-all mt-2">
            {location.pathname}
          </AlertDescription>
        </Alert>
        
        {isApiPath && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h2 className="font-semibold mb-2 text-amber-800">Point d'API non trouvé</h2>
            <p className="text-sm text-amber-700 mb-2">
              L'URL demandée fait référence à un point d'API qui n'existe pas ou n'est pas accessible.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs justify-start"
                onClick={() => window.open(`${apiBaseUrl}/info.php`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Tester info.php
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs justify-start"
                onClick={() => window.open(`${apiBaseUrl}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Diagnostic API
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex justify-center">
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
