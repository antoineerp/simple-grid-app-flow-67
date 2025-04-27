import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Globe, Settings, Wifi, WifiOff } from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiBaseUrl } from '@/config/apiConfig';
import { useForm } from 'react-hook-form';

interface RouteCheckResult {
  url: string;
  domain: string;
  status: string;
  exists: boolean;
  response_code: number;
  error: string | null;
  response_sample: string | null;
}

interface RouteCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  request_info: {
    use_current_domain: boolean;
    custom_base_url: string | null;
    timeout: number;
    verify_ssl: boolean;
  };
  total_routes: number;
  problematic_routes: number;
  existing_routes: number;
  connection_errors: number;
  error_summary: Record<string, number>;
  response_codes_summary: Record<string, number>;
  results: RouteCheckResult[];
}

interface CheckRoutesFormData {
  useCurrentDomain: boolean;
  baseUrl: string;
  timeout: number;
  verifySSL: boolean;
}

const RoutesCheck = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<RouteCheckResponse | null>(null);
  const [activeTab, setActiveTab] = useState("problematiques");

  const form = useForm<CheckRoutesFormData>({
    defaultValues: {
      useCurrentDomain: true,
      baseUrl: "",
      timeout: 5,
      verifySSL: false
    }
  });

  const checkRoutes = async (data: CheckRoutesFormData) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('use_current_domain', data.useCurrentDomain ? '1' : '0');
      if (data.baseUrl) {
        params.append('base_url', data.baseUrl);
      }
      params.append('timeout', data.timeout.toString());
      params.append('verify_ssl', data.verifySSL ? '1' : '0');

      const url = `${apiBaseUrl}/route-diagnostic?${params.toString()}`;
      
      const response = await fetch(url);
      const responseData = await response.json();
      
      setResults(responseData);
      
      if (responseData.connection_errors > 0) {
        toast({
          title: "Problèmes de connexion détectés",
          description: `${responseData.connection_errors} routes avec des erreurs de connexion sur ${responseData.total_routes} routes vérifiées.`,
          variant: "destructive",
        });
      } else if (responseData.problematic_routes > 0) {
        toast({
          title: "Routes problématiques détectées",
          description: `${responseData.problematic_routes} routes problématiques sur ${responseData.total_routes} routes vérifiées.`,
          variant: "destructive", 
        });
      } else if (responseData.existing_routes > 0) {
        toast({
          title: "Vérification terminée",
          description: `${responseData.existing_routes} routes valides détectées sur ${responseData.total_routes} routes vérifiées.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Vérification terminée",
          description: `Aucune route valide trouvée parmi les ${responseData.total_routes} routes vérifiées.`,
          variant: "default",
        });
      }
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

  const onSubmit = (data: CheckRoutesFormData) => {
    checkRoutes(data);
  };

  useEffect(() => {
    checkRoutes(form.getValues());
  }, []);

  const getStatusBadge = (route: RouteCheckResult) => {
    if (route.exists) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valide</Badge>;
    } else if (route.error) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Erreur</Badge>;
    } else if (route.response_code === 404) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Introuvable</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{route.response_code || "?"}</Badge>;
    }
  };

  const getFilteredRoutes = () => {
    if (!results) return [];
    
    switch (activeTab) {
      case "problematiques":
        return results.results.filter(r => r.response_code === 404);
      case "erreurs":
        return results.results.filter(r => r.error !== null);
      case "valides":
        return results.results.filter(r => r.exists);
      case "toutes":
      default:
        return results.results;
    }
  };

  const getErrorSummary = () => {
    if (!results || !results.error_summary) return [];
    
    return Object.entries(results.error_summary).map(([error, count]) => ({
      error,
      count
    }));
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Vérification des Routes</h1>
          <p className="text-gray-600 mt-1">Détection des liens cassés et problèmes de connexion</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Options de vérification</CardTitle>
          <CardDescription>
            Configurez les paramètres de vérification des routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="useCurrentDomain"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Utiliser le domaine actuel</FormLabel>
                        <FormDescription>
                          Utiliser l'URL courante pour les tests
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de base personnalisée</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://exemple.com"
                          {...field}
                          disabled={form.watch('useCurrentDomain')}
                        />
                      </FormControl>
                      <FormDescription>
                        Uniquement si "Utiliser le domaine actuel" est désactivé
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (secondes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 5)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="verifySSL"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Vérifier certificats SSL</FormLabel>
                        <FormDescription>
                          Valider les certificats SSL des serveurs
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit"
                disabled={isLoading}
                className="flex items-center w-full md:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Vérification...' : 'Vérifier les routes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-50 p-3 rounded-full mr-4">
                  <Globe className="h-6 w-6 text-blue-500" />
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
                  <p className="text-gray-500 text-sm">Routes 404</p>
                  <p className="text-2xl font-bold">{results.problematic_routes}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border border-yellow-100">
              <div className="flex items-center">
                <div className="bg-yellow-50 p-3 rounded-full mr-4">
                  <WifiOff className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Erreurs connexion</p>
                  <p className="text-2xl font-bold">{results.connection_errors}</p>
                </div>
              </div>
            </div>
          </div>

          {results.connection_errors > 0 && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Résumé des erreurs de connexion
                </CardTitle>
                <CardDescription>
                  Types d'erreurs rencontrées lors de la vérification des routes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-2/3">Type d'erreur</TableHead>
                      <TableHead>Nombre de routes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getErrorSummary().map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.error}</TableCell>
                        <TableCell>{item.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <Tabs defaultValue="problematiques" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="bg-transparent p-0 mx-4 mt-2">
                  <TabsTrigger 
                    value="problematiques" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-app-blue data-[state=active]:shadow-none rounded-none"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Routes 404 ({results.problematic_routes})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="erreurs" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-app-blue data-[state=active]:shadow-none rounded-none"
                  >
                    <WifiOff className="h-4 w-4 mr-2 text-yellow-500" />
                    Erreurs ({results.connection_errors})
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
                    Toutes ({results.total_routes})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="problematiques" className="m-0">
                <RouteTable routes={getFilteredRoutes()} />
              </TabsContent>
              <TabsContent value="erreurs" className="m-0">
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

          <div className="text-sm text-gray-500 italic flex items-center justify-between">
            <span>Dernière vérification : {results.timestamp}</span>
            <span>
              Domaine testé : {results.request_info.custom_base_url || (results.request_info.use_current_domain ? "Domaine courant" : "qualiopi.ch")}
            </span>
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
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12 text-center">Statut</TableHead>
            <TableHead>URL</TableHead>
            <TableHead className="w-28">Code</TableHead>
            <TableHead className="w-1/4">Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route, index) => (
            <TableRow 
              key={index} 
              className={
                route.error ? "bg-yellow-50" : 
                route.response_code === 404 ? "bg-red-50" :
                route.exists ? "bg-green-50" : ""
              }
            >
              <TableCell className="text-center">
                {route.exists ? (
                  <CheckCircle className="h-5 w-5 text-green-500 inline-block" />
                ) : route.error ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500 inline-block" />
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
                      route.exists ? "bg-green-50 text-green-700 border-green-200" :
                      route.error ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      route.response_code === 404 ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {route.response_code || "?"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {route.error ? (
                  <span className="text-yellow-700">{route.error}</span>
                ) : (
                  <span>{route.status?.replace(/^HTTP\/[\d.]+ [\d]+ /, '') || "Non disponible"}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RoutesCheck;
