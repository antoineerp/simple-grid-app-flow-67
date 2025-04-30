
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
import { triggerSync } from '@/services/sync/triggerSync';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

interface SyncDiagnosticPanelProps {
  onClose: () => void;
}

interface SyncInfo {
  tableName: string;
  lastSynced: Date | null;
  syncFailed: boolean;
  localCount: number;
  pendingSync: boolean;
  status: 'ok' | 'warning' | 'error' | 'unknown';
  message: string;
}

export const SyncDiagnosticPanel: React.FC<SyncDiagnosticPanelProps> = ({ onClose }) => {
  const { syncStates, isOnline, syncAll, syncTable } = useGlobalSync();
  const [syncInfos, setSyncInfos] = useState<SyncInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForcingSyncAll, setIsForcingSyncAll] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Fonction pour scanner les données et collecter les informations de synchronisation
  const scanSyncData = async () => {
    setIsLoading(true);
    setProgress(10);
    
    try {
      const tables = [
        'documents', 'exigences', 'membres', 'collaboration',
        'configuration', 'formations', 'ressourcesHumaines'
      ];
      
      const infos: SyncInfo[] = [];
      
      // Analyser chaque table connue
      for (let i = 0; i < tables.length; i++) {
        const tableName = tables[i];
        setProgress(10 + (i * 80 / tables.length));
        
        // Récupérer l'état de synchronisation depuis le contexte global
        const syncState = syncStates[tableName];
        
        // Vérifier si des données locales existent
        const localStorageKeys = Object.keys(localStorage).filter(key => 
          key.startsWith(`${tableName}_`) && 
          !key.includes('last_synced') &&
          !key.includes('sync_states') &&
          !key.includes('sync_pending') &&
          !key.includes('sync_in_progress')
        );
        
        // Compter les entrées locales
        let localCount = 0;
        for (const key of localStorageKeys) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(data)) {
              localCount += data.length;
            }
          } catch (e) {
            console.error(`Erreur lors de la lecture de ${key}:`, e);
          }
        }
        
        // Vérifier si une synchronisation est en attente
        const pendingSync = localStorage.getItem(`sync_pending_${tableName}`) !== null;
        
        // Déterminer le statut
        let status: 'ok' | 'warning' | 'error' | 'unknown' = 'unknown';
        let message = "Statut inconnu";
        
        if (syncState) {
          if (syncState.syncFailed) {
            status = 'error';
            message = "La dernière synchronisation avec Infomaniak a échoué";
          } else if (!syncState.lastSynced) {
            status = 'warning';
            message = "Jamais synchronisé avec Infomaniak";
          } else if (pendingSync) {
            status = 'warning';
            message = "Modifications en attente de synchronisation avec Infomaniak";
          } else {
            status = 'ok';
            message = "Synchronisé avec Infomaniak";
          }
        } else if (localCount > 0) {
          status = 'warning';
          message = "Données locales présentes, mais état de synchronisation inconnu";
        } else {
          status = 'unknown';
          message = "Aucune donnée locale ou état de synchronisation";
        }
        
        infos.push({
          tableName,
          lastSynced: syncState?.lastSynced || null,
          syncFailed: syncState?.syncFailed || false,
          localCount,
          pendingSync,
          status,
          message
        });
      }
      
      setProgress(100);
      setSyncInfos(infos);
    } catch (error) {
      console.error("Erreur lors de l'analyse des données de synchronisation:", error);
      toast({
        variant: "destructive",
        title: "Erreur de diagnostic",
        description: "Impossible d'analyser l'état de synchronisation. Veuillez réessayer."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour forcer la synchronisation de toutes les tables
  const handleForceSyncAll = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne."
      });
      return;
    }
    
    setIsForcingSyncAll(true);
    
    try {
      const results = await syncAll();
      
      const successCount = Object.values(results).filter(r => r).length;
      const totalCount = Object.keys(results).length;
      
      if (totalCount === 0) {
        toast({
          title: "Aucune synchronisation nécessaire",
          description: "Aucune table n'avait besoin d'être synchronisée avec Infomaniak."
        });
      } else if (successCount === totalCount) {
        toast({
          title: "Synchronisation complète réussie",
          description: `${successCount} tables ont été synchronisées avec succès avec Infomaniak.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Synchronisation partielle",
          description: `${successCount}/${totalCount} tables ont été synchronisées avec Infomaniak.`
        });
      }
      
      // Mettre à jour les informations
      await scanSyncData();
    } catch (error) {
      console.error("Erreur lors de la synchronisation forcée:", error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation avec Infomaniak."
      });
    } finally {
      setIsForcingSyncAll(false);
    }
  };
  
  // Fonction pour réparer les synchronisations bloquées
  const handleRepairBlockedSync = () => {
    try {
      const pendingSyncKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sync_in_progress_')
      );
      
      if (pendingSyncKeys.length === 0) {
        toast({
          title: "Aucune réparation nécessaire",
          description: "Aucune synchronisation bloquée détectée."
        });
        return;
      }
      
      // Supprimer les indicateurs de synchronisation en cours
      pendingSyncKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({
        title: "Réparation effectuée",
        description: `${pendingSyncKeys.length} synchronisations bloquées ont été réparées. Vous pouvez maintenant réessayer.`
      });
      
      // Mettre à jour les informations
      scanSyncData();
    } catch (error) {
      console.error("Erreur lors de la réparation des synchronisations bloquées:", error);
      toast({
        variant: "destructive",
        title: "Erreur de réparation",
        description: "Une erreur est survenue lors de la réparation des synchronisations bloquées."
      });
    }
  };
  
  // Fonction pour forcer la synchronisation d'une table spécifique
  const handleForceSync = async (tableName: string) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne."
      });
      return;
    }
    
    try {
      // Trouver les données locales pour la table
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${tableName}_`) && 
        !key.includes('last_synced') &&
        !key.includes('sync_states') &&
        !key.includes('sync_pending') &&
        !key.includes('sync_in_progress')
      );
      
      let data: any[] = [];
      
      if (localStorageKeys.length > 0) {
        // Utiliser les premières données trouvées
        try {
          data = JSON.parse(localStorage.getItem(localStorageKeys[0]) || '[]');
          if (!Array.isArray(data)) {
            data = [];
          }
        } catch (e) {
          console.error(`Erreur lors de la lecture de ${localStorageKeys[0]}:`, e);
          data = [];
        }
      }
      
      if (data.length === 0) {
        toast({
          variant: "destructive",
          title: "Aucune donnée locale",
          description: `Aucune donnée locale trouvée pour ${tableName}. Impossible de forcer la synchronisation.`
        });
        return;
      }
      
      toast({
        title: "Synchronisation en cours",
        description: `Tentative de synchronisation de ${tableName} avec Infomaniak...`
      });
      
      // Forcer la synchronisation
      const result = await syncTable(tableName, data);
      
      if (result) {
        toast({
          title: "Synchronisation réussie",
          description: `${tableName} a été synchronisé avec succès avec Infomaniak.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la synchronisation",
          description: `La synchronisation de ${tableName} avec Infomaniak a échoué.`
        });
      }
      
      // Mettre à jour les informations
      await scanSyncData();
    } catch (error) {
      console.error(`Erreur lors de la synchronisation forcée de ${tableName}:`, error);
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: `Une erreur est survenue lors de la synchronisation de ${tableName} avec Infomaniak.`
      });
    }
  };
  
  // Charger les informations de synchronisation au démarrage
  useEffect(() => {
    scanSyncData();
  }, []);
  
  return (
    <div className="space-y-4 py-4">
      {/* État de la connexion */}
      <Alert variant={isOnline ? "default" : "destructive"}>
        <Database className="h-4 w-4" />
        <AlertTitle>{isOnline ? "Connecté à Infomaniak" : "Déconnecté d'Infomaniak"}</AlertTitle>
        <AlertDescription>
          {isOnline 
            ? "La synchronisation avec Infomaniak est disponible." 
            : "La synchronisation avec Infomaniak n'est pas disponible en mode hors ligne."}
        </AlertDescription>
      </Alert>
      
      {/* Actions de diagnostic */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={scanSyncData}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Analyser l'état de synchronisation
        </Button>
        
        <Button
          variant="default"
          onClick={handleForceSyncAll}
          disabled={!isOnline || isForcingSyncAll}
          className="gap-2"
        >
          {isForcingSyncAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          Forcer la synchronisation complète
        </Button>
        
        <Button
          variant="secondary"
          onClick={handleRepairBlockedSync}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Réparer les synchronisations bloquées
        </Button>
      </div>
      
      {isLoading && (
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">Analyse en cours...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Liste des tables et leur état de synchronisation */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {syncInfos.map((info) => (
            <Card key={info.tableName} className="p-4 relative">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{info.tableName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{info.message}</p>
                </div>
                <Badge 
                  variant={
                    info.status === 'ok' ? 'default' : 
                    info.status === 'warning' ? 'warning' : 
                    info.status === 'error' ? 'destructive' : 
                    'outline'
                  }
                >
                  {info.status === 'ok' && 'Synchronisé'}
                  {info.status === 'warning' && 'Attention'}
                  {info.status === 'error' && 'Échec'}
                  {info.status === 'unknown' && 'Inconnu'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-muted-foreground">Dernière sync:</span>{' '}
                  {info.lastSynced ? new Date(info.lastSynced).toLocaleString() : 'Jamais'}
                </div>
                <div>
                  <span className="text-muted-foreground">Données locales:</span>{' '}
                  {info.localCount} éléments
                </div>
                <div>
                  <span className="text-muted-foreground">Sync en attente:</span>{' '}
                  {info.pendingSync ? 'Oui' : 'Non'}
                </div>
                <div>
                  <span className="text-muted-foreground">Échec de sync:</span>{' '}
                  {info.syncFailed ? 'Oui' : 'Non'}
                </div>
              </div>
              
              <Button 
                onClick={() => handleForceSync(info.tableName)}
                disabled={!isOnline || info.localCount === 0}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Forcer la synchronisation
              </Button>
            </Card>
          ))}
        </div>
      )}
      
      {/* Bouton de fermeture */}
      <div className="flex justify-end mt-4">
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
};
