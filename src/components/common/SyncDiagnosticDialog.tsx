
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Terminal, AlertTriangle, Check } from "lucide-react";
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { SyncDiagnostic } from '@/utils/SyncDiagnostic';
import { toast } from '@/components/ui/use-toast';

interface SyncDiagnosticDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SyncDiagnosticDialog: React.FC<SyncDiagnosticDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { isOnline } = useNetworkStatus();
  const { syncAll, syncStates } = useGlobalSync();
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);
  const [selectedTab, setSelectedTab] = useState("general");
  
  // Tables à diagnostiquer
  const tables = [
    'documents', 'exigences', 'membres', 
    'bibliotheque', 'collaboration', 'test_table'
  ];
  
  // Exécuter un diagnostic complet
  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    
    try {
      // Diagnostic général
      const generalDiagnostic = SyncDiagnostic.checkSyncStatus();
      
      // Diagnostics spécifiques par table
      const tableDiagnostics = {};
      for (const table of tables) {
        tableDiagnostics[table] = SyncDiagnostic.checkTableStatus(table);
      }
      
      // Stocker les résultats
      setDiagnosticResults({
        general: generalDiagnostic,
        tables: tableDiagnostics,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Diagnostic terminé",
        description: "Tous les diagnostics de synchronisation ont été effectués avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors du diagnostic:", error);
      toast({
        variant: "destructive",
        title: "Échec du diagnostic",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du diagnostic.",
      });
    } finally {
      setIsRunningDiagnostic(false);
    }
  };
  
  // Forcer une synchronisation complète
  const forceSync = async () => {
    setIsPerformingAction(true);
    
    try {
      // Réinitialiser d'abord les synchronisations bloquées
      SyncDiagnostic.repairBlockedSyncs();
      
      // Puis forcer une synchronisation complète
      await syncAll();
      
      toast({
        title: "Synchronisation forcée",
        description: "La synchronisation forcée a été déclenchée avec succès.",
      });
      
      // Mettre à jour les diagnostics après synchronisation
      setTimeout(() => {
        runDiagnostic();
      }, 3000);
      
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la synchronisation.",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };
  
  // Réparer les synchronisations bloquées
  const repairSync = () => {
    setIsPerformingAction(true);
    
    try {
      const repairedCount = SyncDiagnostic.repairBlockedSyncs();
      
      toast({
        title: "Réparation terminée",
        description: `${repairedCount} synchronisations bloquées ont été réparées.`,
      });
      
      // Mettre à jour les diagnostics après réparation
      runDiagnostic();
      
    } catch (error) {
      console.error("Erreur lors de la réparation:", error);
      toast({
        variant: "destructive",
        title: "Échec de la réparation",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la réparation.",
      });
    } finally {
      setIsPerformingAction(false);
    }
  };
  
  // Exécuter un diagnostic automatiquement à l'ouverture
  useEffect(() => {
    if (open) {
      runDiagnostic();
    }
  }, [open]);
  
  // Formater les données JSON pour l'affichage
  const formatJSONDisplay = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return "Erreur d'affichage des données";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Diagnostic de synchronisation</DialogTitle>
          <DialogDescription>
            Cet outil vous permet de diagnostiquer et résoudre les problèmes de synchronisation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-4">
              {isOnline ? (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Vous êtes connecté à internet. La synchronisation est possible.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    Vous êtes en mode hors ligne. La synchronisation n'est pas possible pour le moment.
                  </AlertDescription>
                </Alert>
              )}
              
              <ScrollArea className="h-[400px] border rounded-md p-4 bg-slate-50">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">État des synchronisations:</h3>
                  {diagnosticResults?.general?.pendingSync && (
                    <>
                      <div>
                        <p className="text-sm font-medium mb-1">Synchronisations en attente ({diagnosticResults.general.pendingSync.length}):</p>
                        <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                          {formatJSONDisplay(diagnosticResults.general.pendingSync)}
                        </pre>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Synchronisations en cours ({diagnosticResults.general.inProgressSync.length}):</p>
                        <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                          {formatJSONDisplay(diagnosticResults.general.inProgressSync)}
                        </pre>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">États de synchronisation:</p>
                        <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                          {formatJSONDisplay(diagnosticResults.general.syncStates)}
                        </pre>
                      </div>
                    </>
                  )}
                  
                  {!diagnosticResults && (
                    <div className="text-center p-4">
                      <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                      <p className="mt-2 text-gray-500">Chargement du diagnostic...</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="tables" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {tables.map(table => (
                    <div key={table} className="border rounded-md p-4 bg-slate-50">
                      <h3 className="text-sm font-medium mb-2 flex items-center justify-between">
                        <span>Table: {table}</span>
                        
                        {diagnosticResults?.tables?.[table]?.isInSync && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            En cours de sync
                          </span>
                        )}
                      </h3>
                      
                      {diagnosticResults?.tables?.[table] ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {diagnosticResults.tables[table].keyCount} entrées trouvées dans localStorage
                          </p>
                          
                          <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto max-h-[200px]">
                            {formatJSONDisplay(diagnosticResults.tables[table].tableData)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Pas de données disponibles</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-4">
              <div className="space-y-4">
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="text-sm font-medium mb-2">Forcer la synchronisation complète</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Cette action va tenter de synchroniser toutes les tables avec le serveur.
                  </p>
                  <Button 
                    onClick={forceSync} 
                    disabled={isPerformingAction || !isOnline}
                    className="w-full"
                  >
                    {isPerformingAction ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Synchronisation en cours...
                      </>
                    ) : (
                      "Forcer la synchronisation"
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="text-sm font-medium mb-2">Réparer les synchronisations bloquées</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Cette action va réinitialiser les indicateurs de synchronisation en cours qui pourraient être bloqués.
                  </p>
                  <Button 
                    onClick={repairSync} 
                    disabled={isPerformingAction}
                    variant="outline" 
                    className="w-full"
                  >
                    Réparer les synchronisations bloquées
                  </Button>
                </div>
                
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="text-sm font-medium mb-2">Diagnostic complet</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Exécuter un nouveau diagnostic complet de la synchronisation.
                  </p>
                  <Button 
                    onClick={runDiagnostic} 
                    disabled={isRunningDiagnostic}
                    variant="secondary" 
                    className="w-full"
                  >
                    {isRunningDiagnostic ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Diagnostic en cours...
                      </>
                    ) : (
                      "Exécuter le diagnostic"
                    )}
                  </Button>
                </div>
                
                <div className="border rounded-md p-4 bg-slate-50">
                  <h3 className="text-sm font-medium mb-2">Ouvrir la console</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Ouvrez la console de votre navigateur pour voir les logs détaillés (F12 ou Cmd+Option+I).
                  </p>
                  <Button 
                    onClick={() => console.log("Console déjà ouverte")}
                    variant="link" 
                    className="w-full"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Afficher dans la console
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {diagnosticResults?.timestamp && (
              <>Dernière mise à jour: {new Date(diagnosticResults.timestamp).toLocaleTimeString()}</>
            )}
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SyncDiagnosticDialog;
