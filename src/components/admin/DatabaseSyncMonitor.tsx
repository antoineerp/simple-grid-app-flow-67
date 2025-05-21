
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminDatabase } from "@/hooks/useAdminDatabase";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";

/**
 * Composant qui surveille les synchronisations de base de données entre appareils
 */
const DatabaseSyncMonitor: React.FC = () => {
  const { toast } = useToast();
  const { loadDatabaseInfo, handleTestConnection, lastSync } = useAdminDatabase();
  const [syncStatus, setSyncStatus] = useState<'initial' | 'syncing' | 'synced' | 'error'>('initial');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Suivre les événements de synchronisation
  useEffect(() => {
    // Gestionnaire pour les événements de stockage
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key && event.key.includes('dbSync_timestamp')) {
        const timestamp = event.newValue ? new Date(event.newValue).toLocaleTimeString() : null;
        setLastSyncTime(timestamp);
        setSyncStatus('synced');
        
        console.log("Synchronisation détectée depuis un autre appareil:", timestamp);
        
        toast({
          title: "Base de données synchronisée",
          description: "Mise à jour détectée depuis un autre appareil",
        });
        
        // Recharger les informations
        loadDatabaseInfo();
      }
    };
    
    // Gestionnaire pour les événements personnalisés
    const handleDatabaseSync = (event: CustomEvent) => {
      console.log("Événement de synchronisation reçu:", event.detail);
      if (event.detail && event.detail.timestamp) {
        const timestamp = new Date(event.detail.timestamp).toLocaleTimeString();
        setLastSyncTime(timestamp);
        setSyncStatus('synced');
      }
    };
    
    // S'abonner aux événements
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('database-synced' as any, handleDatabaseSync as EventListener);
    
    // Récupérer le dernier timestamp connu
    const lastTimestamp = localStorage.getItem('dbSync_timestamp');
    if (lastTimestamp) {
      setLastSyncTime(new Date(lastTimestamp).toLocaleTimeString());
      setSyncStatus('synced');
    }
    
    // Nettoyage lors du démontage
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('database-synced' as any, handleDatabaseSync as EventListener);
    };
  }, [loadDatabaseInfo, toast]);

  // Mettre à jour l'heure de dernière synchronisation lorsque lastSync change
  useEffect(() => {
    if (lastSync) {
      setLastSyncTime(lastSync.toLocaleTimeString());
      setSyncStatus('synced');
    }
  }, [lastSync]);

  // Initialiser la synchronisation au chargement
  useEffect(() => {
    setSyncStatus('syncing');
    loadDatabaseInfo()
      .then(() => {
        setSyncStatus('synced');
      })
      .catch(() => {
        setSyncStatus('error');
      });
  }, [loadDatabaseInfo]);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base">État de synchronisation</CardTitle>
            <CardDescription>Suivi des synchronisations entre appareils</CardDescription>
          </div>
          
          <Badge 
            variant={
              syncStatus === 'synced' ? 'default' : 
              syncStatus === 'syncing' ? 'outline' : 
              'destructive'
            }
            className="ml-2"
          >
            {syncStatus === 'synced' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
            {syncStatus === 'syncing' && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            {syncStatus === 'error' && <XCircle className="h-3.5 w-3.5 mr-1" />}
            {syncStatus === 'synced' ? 'Synchronisé' : 
             syncStatus === 'syncing' ? 'En cours...' : 
             'Erreur'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          {lastSyncTime ? (
            <p>Dernière synchronisation: <span className="font-medium">{lastSyncTime}</span></p>
          ) : (
            <p>Aucune synchronisation récente</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Les données sont automatiquement partagées entre tous vos appareils connectés
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSyncMonitor;
