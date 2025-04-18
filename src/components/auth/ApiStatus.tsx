
import React from 'react';
import { useApiStatusCheck } from '@/hooks/useApiStatusCheck';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ServerCrash, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ApiStatus() {
  const { apiStatus, apiMessage, phpInfo, retestApi } = useApiStatusCheck();
  const [isOpen, setIsOpen] = React.useState(false);

  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'php-error':
        return <ServerCrash className="h-4 w-4 text-orange-500" />;
      case 'error':
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'checking':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'php-error':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'error':
      default:
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  return (
    <div className="space-y-2">
      <Alert className={`${getStatusColor()} p-3 border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <AlertTitle>État API:</AlertTitle>
            <AlertDescription className="font-medium">
              {apiStatus === 'available' && 'Connectée'}
              {apiStatus === 'checking' && 'Vérification...'}
              {apiStatus === 'php-error' && 'Erreur PHP'}
              {apiStatus === 'error' && 'Non disponible'}
            </AlertDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={retestApi}
            disabled={apiStatus === 'checking'}
            className="ml-auto"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${apiStatus === 'checking' ? 'animate-spin' : ''}`} />
            Vérifier
          </Button>
        </div>
        
        <div className="mt-2 text-sm">
          {apiMessage}
        </div>
        
        {apiStatus === 'php-error' && (
          <Alert className="mt-3 bg-yellow-100 border-yellow-300 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration PHP incorrecte</AlertTitle>
            <AlertDescription>
              Le serveur ne traite pas correctement les fichiers PHP. Contactez votre administrateur pour vérifier 
              la configuration du serveur Apache et PHP. Assurez-vous que le module PHP est activé et correctement 
              configuré pour traiter les fichiers .php.
            </AlertDescription>
          </Alert>
        )}
        
        {phpInfo && (
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="mt-3 border rounded-md p-2"
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex w-full justify-between items-center p-2">
                <span>Informations PHP détaillées</span>
                <Badge variant="outline">{phpInfo.version}</Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-48 rounded-md border p-2 mt-2">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium">Version PHP</h4>
                    <p className="text-sm">{phpInfo.version}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">API Serveur</h4>
                    <p className="text-sm">{phpInfo.server_api}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Fichier INI chargé</h4>
                    <p className="text-sm break-all">{phpInfo.loaded_ini}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Environnement</h4>
                    <p className="text-sm">{phpInfo.environment}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Variables d'environnement</h4>
                    <ul className="text-xs space-y-1">
                      {Object.entries(phpInfo.environment_vars).map(([key, value]) => (
                        <li key={key} className="break-all">
                          <span className="font-medium">{key}:</span> {value as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Extensions ({phpInfo.extensions.length})</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(phpInfo.extensions as string[]).map((ext) => (
                        <Badge key={ext} variant="outline" className="text-xs">{ext}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}
      </Alert>
    </div>
  );
}

export default ApiStatus;
