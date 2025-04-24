
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, RefreshCw, FileText, Server, Package } from "lucide-react";
import { getApiUrl } from '@/config/apiConfig';
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssetFile {
  name: string;
  size: number;
  modified: string;
  type: string;
}

interface PhpExecutionData {
  status: string;
  message: string;
  timestamp: string;
  php_info: {
    version: string;
    execution: boolean;
    extensions: Record<string, boolean>;
  };
  server_info: Record<string, string>;
  server_software: string;
  assets: {
    directory_exists: boolean;
    path: string;
    files_count: number;
    files: AssetFile[];
  };
  config_files: Record<string, boolean>;
  index_html: {
    exists: boolean;
    preview: string;
  };
}

const PhpExecutionTest = () => {
  const [data, setData] = useState<PhpExecutionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    setResponseText(null);
    
    try {
      const apiUrl = `${getApiUrl()}/php-execution-test.php`;
      console.log("Exécution du test PHP à:", apiUrl);
      
      const response = await fetch(apiUrl);
      const contentType = response.headers.get('content-type') || '';
      const responseRawText = await response.text();
      setResponseText(responseRawText);
      
      console.log(`Réponse reçue (${response.status})`, contentType);
      console.log("Texte brut:", responseRawText.substring(0, 500));
      
      // Vérifier si la réponse est du PHP non exécuté
      if (responseRawText.trim().startsWith('<?php')) {
        throw new Error("Le serveur renvoie du code PHP au lieu de l'exécuter");
      }
      
      // Vérifier le type de contenu
      if (!contentType.includes('json')) {
        console.warn("Warning: La réponse n'est pas du JSON selon le Content-Type:", contentType);
      }
      
      let jsonData;
      try {
        jsonData = JSON.parse(responseRawText);
      } catch (e) {
        throw new Error("Impossible de parser la réponse en JSON");
      }
      
      setData(jsonData);
    } catch (error) {
      console.error("Erreur lors du test:", error);
      setError(error instanceof Error ? error.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  // Fonction pour styliser les tailles de fichier
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Diagnostic d'exécution PHP</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runTest} 
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Test en cours...' : 'Relancer le test'}
          </Button>
        </CardTitle>
        <CardDescription>
          Vérifie l'exécution PHP du serveur, les fichiers assets et la configuration
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Test en cours d'exécution...</div>
            <Progress value={50} className="w-full" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Erreur de diagnostic</AlertTitle>
            <AlertDescription>
              {error}
              
              {responseText && responseText.startsWith('<?php') && (
                <div className="mt-2">
                  <div className="font-semibold text-sm mt-2">Le serveur ne parvient pas à exécuter le PHP:</div>
                  <ScrollArea className="h-24 w-full rounded-md border mt-2 bg-muted/50 text-xs font-mono">
                    <pre className="p-4">{responseText.substring(0, 500)}...</pre>
                  </ScrollArea>
                  
                  <div className="mt-2 text-sm">
                    Vérifiez la configuration du serveur pour l'exécution PHP.
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Informations PHP */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Serveur & PHP
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Exécution PHP:</span>
                      {data.php_info.execution ? (
                        <Badge className="bg-green-500">Fonctionnelle</Badge>
                      ) : (
                        <Badge variant="destructive">Échouée</Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Version PHP:</span>
                      <span className="font-mono text-sm">{data.php_info.version}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Serveur:</span>
                      <span className="font-mono text-xs truncate max-w-[200px]" title={data.server_software}>
                        {data.server_software}
                      </span>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">Extensions PHP:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(data.php_info.extensions).map(([ext, loaded]) => (
                          <Badge key={ext} variant={loaded ? "default" : "outline"} className={loaded ? "bg-green-500" : ""}>
                            {ext}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Fichiers de configuration */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Fichiers de configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(data.config_files).map(([file, exists]) => (
                      <div key={file} className="flex justify-between items-center">
                        <span className="text-sm font-mono">{file}</span>
                        {exists ? (
                          <Badge className="bg-green-500">Présent</Badge>
                        ) : (
                          <Badge variant="destructive">Manquant</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Assets */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Fichiers Assets ({data.assets.files_count})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data.assets.directory_exists ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Répertoire des assets introuvable</AlertTitle>
                    <AlertDescription>
                      Le répertoire des assets n'a pas été trouvé: {data.assets.path}
                    </AlertDescription>
                  </Alert>
                ) : data.assets.files_count === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Aucun fichier asset</AlertTitle>
                    <AlertDescription>
                      Le répertoire des assets est vide: {data.assets.path}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-64 w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Taille</TableHead>
                          <TableHead>Modifié</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.assets.files.map((file, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{file.name}</TableCell>
                            <TableCell>{file.type}</TableCell>
                            <TableCell>{formatFileSize(file.size)}</TableCell>
                            <TableCell>{file.modified}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
            
            {/* Index HTML */}
            {data.index_html.exists && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Fichier index.html
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32 w-full rounded-md border bg-muted/50">
                    <pre className="p-4 text-xs font-mono">{data.index_html.preview}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Dernier test: {data?.timestamp || 'Jamais'}
        </div>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs" 
          onClick={() => window.open(`${getApiUrl()}/phpinfo.php`, '_blank')}
        >
          Voir PHPInfo
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PhpExecutionTest;
