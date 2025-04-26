
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config/apiConfig';

interface RouteCheckResult {
  url: string;
  status: string;
  exists: boolean;
  response_code: number;
  response_sample: string | null;
}

interface RouteCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  total_routes: number;
  problematic_routes: number;
  existing_routes: number;
  results: RouteCheckResult[];
}

const RoutesCheck = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RouteCheckResponse | null>(null);
  const [activeTab, setActiveTab] = useState("problematiques");

  const checkRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/check-routes`);
      const data = await response.json();
      setResults(data);
      toast({
        title: "Vérification terminée",
        description: `${data.problematic_routes} routes problématiques détectées sur ${data.total_routes} routes vérifiées.`,
      });
    } catch (error) {
      console.error("Erreur lors de la vérification des routes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier les routes. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkRoutes();
  }, []);

  const getStatusBadge = (route: RouteCheckResult) => {
    if (route.response_code === 200) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valide</Badge>;
    } else if (route.response_code === 404) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Introuvable</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{route.response_code}</Badge>;
    }
  };

  const getFilteredRoutes = () => {
    if (!results) return [];
    
    switch (activeTab) {
      case "problematiques":
        return results.results.filter(r => r.response_code === 404);
      case "valides":
        return results.results.filter(r => r.exists);
      case "toutes":
      default:
        return results.results;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Vérification des Routes</h1>
          <p className="text-gray-600 mt-1">Détection des liens cassés et problèmes de routage</p>
        </div>
        <Button 
          onClick={checkRoutes} 
          disabled={isLoading}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Vérification...' : 'Vérifier les routes'}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-full mr-4">
                  <RefreshCw className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Routes vérifiées</p>
                  <p className="text-2xl font-bold">{results.total_routes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border border-green-100">
              <div className="flex items-center">
                <div className="bg-green-50 p-3 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Routes valides</p>
                  <p className="text-2xl font-bold">{results.existing_routes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border border-red-100">
              <div className="flex items-center">
                <div className="bg-red-50 p-3 rounded-full mr-4">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Routes problématiques</p>
                  <p className="text-2xl font-bold">{results.problematic_routes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <Tabs defaultValue="problematiques" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="bg-transparent p-0 mx-4 mt-2">
                  <TabsTrigger 
                    value="problematiques" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-app-blue data-[state=active]:shadow-none rounded-none"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    Problématiques ({results.problematic_routes})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="valides" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-app-blue data-[state=active]:shadow-none rounded-none"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Valides ({results.existing_routes})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="toutes" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-app-blue data-[state=active]:shadow-none rounded-none"
                  >
                    Toutes les routes ({results.total_routes})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="problematiques" className="m-0">
                <RouteTable routes={getFilteredRoutes()} />
              </TabsContent>
              <TabsContent value="valides" className="m-0">
                <RouteTable routes={getFilteredRoutes()} />
              </TabsContent>
              <TabsContent value="toutes" className="m-0">
                <RouteTable routes={getFilteredRoutes()} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="text-sm text-gray-500 italic">
            Dernière vérification : {results.timestamp}
          </div>
        </div>
      )}

      {!results && !isLoading && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-lg font-medium text-gray-700">Aucun résultat disponible</p>
          <p className="text-gray-500 mt-1">Cliquez sur le bouton "Vérifier les routes" pour commencer</p>
        </div>
      )}

      {isLoading && !results && (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-gray-200">
          <RefreshCw className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
          <p className="text-lg font-medium text-gray-700">Vérification des routes en cours...</p>
          <p className="text-gray-500 mt-1">Veuillez patienter pendant la vérification des routes</p>
        </div>
      )}
    </div>
  );
};

const RouteTable = ({ routes }: { routes: RouteCheckResult[] }) => {
  if (routes.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Aucune route dans cette catégorie</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-12 text-center">Statut</TableHead>
          <TableHead>URL</TableHead>
          <TableHead className="w-48">Code</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {routes.map((route, index) => (
          <TableRow key={index} className={route.response_code === 404 ? "bg-red-50" : ""}>
            <TableCell className="text-center">
              {route.exists ? (
                <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 inline-block" />
              )}
            </TableCell>
            <TableCell className="font-mono text-sm break-all">
              <a 
                href={route.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {route.url.replace(/^https?:\/\/[^/]+\/api\//, '/api/')}
              </a>
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Badge 
                  variant="outline" 
                  className={`mr-2 ${
                    route.response_code === 200 ? "bg-green-50 text-green-700 border-green-200" :
                    route.response_code === 404 ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-yellow-50 text-yellow-700 border-yellow-200"
                  }`}
                >
                  {route.response_code}
                </Badge>
                <span className="text-gray-600 text-sm">{route.status?.replace(/^HTTP\/[\d.]+ [\d]+ /, '')}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default RoutesCheck;
