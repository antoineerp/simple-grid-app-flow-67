import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownUp, CheckCircle, Clock, RefreshCcw, XCircle } from "lucide-react";
import { useSyncContext } from '@/context/SyncContext';
import { startEntitySync, getSyncStatus } from '@/services/sync';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';

interface EntitySyncStatus {
  entity: string;
  lastSync: Date | null;
  status: 'success' | 'error' | 'pending' | 'syncing';
  error?: string;
}

interface SyncDiagnosticPanelProps {
  onClose?: () => void;
}

const SyncDiagnosticPanel: React.FC<SyncDiagnosticPanelProps> = ({ onClose }) => {
  const { syncStatus, startSync, endSync } = useSyncContext();
  const [entityStatuses, setEntityStatuses] = useState<EntitySyncStatus[]>([
    { entity: 'membres', lastSync: null, status: 'pending' },
    { entity: 'documents', lastSync: null, status: 'pending' },
    { entity: 'formations', lastSync: null, status: 'pending' },
    { entity: 'evaluations', lastSync: null, status: 'pending' }
  ]);
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Charger le statut initial des entités
  useEffect(() => {
    const loadEntityStatuses = async () => {
      const updatedStatuses = [...entityStatuses];
      
      for (let i = 0; i < updatedStatuses.length; i++) {
        try {
          const status = await getSyncStatus(updatedStatuses[i].entity);
          updatedStatuses[i] = {
            ...updatedStatuses[i],
            lastSync: status.lastSync,
            status: status.status === 'success' ? 'success' : 'error'
          };
        } catch (error) {
          console.error(`Error fetching sync status for ${updatedStatuses[i].entity}:`, error);
        }
      }
      
      setEntityStatuses(updatedStatuses);
    };
    
    loadEntityStatuses();
  }, []);

  // Simuler une synchronisation complète
  const handleSyncAll = async () => {
    setLoading(true);
    startSync('all');
    setSyncProgress(0);
    
    // Mettre à jour le statut de toutes les entités à "syncing"
    setEntityStatuses(prev => 
      prev.map(status => ({ ...status, status: 'syncing' }))
    );

    // Synchroniser chaque entité une par une
    for (let i = 0; i < entityStatuses.length; i++) {
      const entity = entityStatuses[i];
      
      // Mettre à jour la progression
      setSyncProgress(Math.round((i / entityStatuses.length) * 100));
      
      try {
        // Synchroniser l'entité
        const success = await startEntitySync(entity.entity);
        
        // Mettre à jour le statut de l'entité
        setEntityStatuses(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: success ? 'success' : 'error',
            lastSync: success ? new Date() : updated[i].lastSync
          };
          return updated;
        });
        
        // Attendre un peu pour la simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error syncing ${entity.entity}:`, error);
        setEntityStatuses(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'error',
            error: 'Échec de la connexion'
          };
          return updated;
        });
      }
    }
    
    // Terminer la synchronisation
    setSyncProgress(100);
    const allSuccess = entityStatuses.every(entity => entity.status === 'success');
    endSync('all', allSuccess);
    
    setLoading(false);
  };

  // Synchroniser une entité spécifique
  const handleSyncEntity = async (entity: string, index: number) => {
    // Mettre à jour le statut de l'entité à "syncing"
    setEntityStatuses(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'syncing' };
      return updated;
    });
    
    startSync(entity);
    
    try {
      // Synchroniser l'entité
      const success = await startEntitySync(entity);
      
      // Mettre à jour le statut de l'entité
      setEntityStatuses(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: success ? 'success' : 'error',
          lastSync: success ? new Date() : updated[index].lastSync
        };
        return updated;
      });
      
      endSync(entity, success);
    } catch (error) {
      console.error(`Error syncing ${entity}:`, error);
      setEntityStatuses(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          status: 'error',
          error: 'Échec de la connexion'
        };
        return updated;
      });
      
      endSync(entity, false, 'Échec de la connexion');
    }
  };

  // Formatter la date de dernière synchronisation
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Jamais';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rendre un badge en fonction du statut de synchronisation
  const renderStatusBadge = (status: EntitySyncStatus['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Synchronisé</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Échec</Badge>;
      case 'syncing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 animate-pulse"><ArrowDownUp className="w-3 h-3 mr-1" /> En cours</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <RefreshCcw className="mr-2 h-5 w-5" />
          Diagnostic de synchronisation
        </CardTitle>
        <CardDescription>
          Vérifiez l'état de synchronisation entre l'application et le serveur
        </CardDescription>
        
        {syncStatus.isSyncing && (
          <div className="mt-2">
            <Progress value={syncProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">Synchronisation en cours: {syncProgress}%</p>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Statut global de synchronisation */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-md">
            <div>
              <p className="font-semibold">Statut global:</p>
              <p className="text-sm text-muted-foreground">
                {syncStatus.lastSynced 
                  ? `Dernière synchronisation: ${new Date(syncStatus.lastSynced).toLocaleString('fr-FR')}`
                  : "Jamais synchronisé"}
              </p>
            </div>
            
            {syncStatus.syncFailed ? (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="w-4 h-4 mr-1" /> Problèmes détectés
              </Badge>
            ) : syncStatus.isSyncing ? (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 animate-pulse">
                <ArrowDownUp className="w-4 h-4 mr-1" /> Synchronisation en cours
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="w-4 h-4 mr-1" /> Système opérationnel
              </Badge>
            )}
          </div>
          
          <Separator />
          
          {/* Liste des entités à synchroniser */}
          <Accordion type="single" collapsible className="w-full">
            {entityStatuses.map((entity, index) => (
              <AccordionItem value={entity.entity} key={entity.entity}>
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="capitalize">{entity.entity}</span>
                    <div className="flex items-center gap-2">
                      {renderStatusBadge(entity.status)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4 py-2 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Dernière synchronisation:</span>
                      <span>{formatLastSync(entity.lastSync)}</span>
                    </div>
                    
                    {entity.error && (
                      <div className="text-sm text-red-600">
                        <span>Erreur: {entity.error}</span>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={() => handleSyncEntity(entity.entity, index)}
                      disabled={entity.status === 'syncing' || syncStatus.isSyncing}
                    >
                      <RefreshCcw className="w-3 h-3 mr-1" />
                      Synchroniser {entity.entity}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSyncAll}
          disabled={loading || syncStatus.isSyncing}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Synchroniser toutes les entités
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SyncDiagnosticPanel;
