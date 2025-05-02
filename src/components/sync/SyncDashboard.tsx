/**
 * Tableau de bord pour la gestion des synchronisations
 */
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { unifiedSync } from '@/services/sync/UnifiedSyncService';

// Liste des tables à surveiller
const TABLES_TO_MONITOR = [
  { id: 'exigences', name: 'Exigences' },
  { id: 'membres', name: 'Membres' },
  { id: 'documents', name: 'Documents' },
  { id: 'collaboration', name: 'Collaboration' }
];

export default function SyncDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [syncStates, setSyncStates] = useState<Record<string, {
    lastSynced: Date | null;
    hasPendingChanges: boolean;
    isSyncing: boolean;
  }>>({});
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Surveiller les changements de connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Effet pour charger l'état initial
  useEffect(() => {
    refreshSyncStates();
  }, []);
  
  // Rafraîchir les états de synchronisation
  const refreshSyncStates = () => {
    setIsLoading(true);
    
    const states: Record<string, any> = {};
    
    // Récupérer l'état pour chaque table
    TABLES_TO_MONITOR.forEach(table => {
      states[table.id] = {
        lastSynced: unifiedSync.getLastSynced(table.id),
        hasPendingChanges: unifiedSync.hasPendingChanges(table.id),
        isSyncing: false
      };
    });
    
    setSyncStates(states);
    setIsLoading(false);
  };
  
  // Forcer la synchronisation d'une table
  const forceSyncTable = async (tableId: string) => {
    // Marquer comme en synchronisation
    setSyncStates(prev => ({
      ...prev, 
      [tableId]: { 
        ...prev[tableId], 
        isSyncing: true 
      }
    }));
    
    try {
      await unifiedSync.forceSyncFromServer(tableId);
      
      // Mettre à jour l'état
      setSyncStates(prev => ({
        ...prev,
        [tableId]: {
          lastSynced: new Date(),
          hasPendingChanges: false,
          isSyncing: false
        }
      }));
      
      toast({
        title: "Synchronisation réussie",
        description: `La table ${tableId} a été synchronisée avec succès.`
      });
    } catch (error) {
      console.error(`Erreur lors de la synchronisation de ${tableId}:`, error);
      
      // Mettre à jour l'état
      setSyncStates(prev => ({
        ...prev,
        [tableId]: {
          ...prev[tableId],
          isSyncing: false
        }
      }));
      
      toast({
        variant: "destructive",
        title: "Erreur de synchronisation",
        description: `La synchronisation de ${tableId} a échoué.`
      });
    }
  };
  
  // Forcer la synchronisation de toutes les tables
  const syncAllTables = async () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Mode hors ligne",
        description: "Impossible de synchroniser en mode hors ligne."
      });
      return;
    }
    
    // Marquer toutes les tables comme en synchronisation
    const updatedStates = { ...syncStates };
    TABLES_TO_MONITOR.forEach(table => {
      updatedStates[table.id] = { 
        ...updatedStates[table.id], 
        isSyncing: true 
      };
    });
    setSyncStates(updatedStates);
    
    // Synchroniser chaque table séquentiellement
    let successCount = 0;
    let errorCount = 0;
    
    for (const table of TABLES_TO_MONITOR) {
      try {
        await unifiedSync.forceSyncFromServer(table.id);
        
        // Mettre à jour l'état
        setSyncStates(prev => ({
          ...prev,
          [table.id]: {
            lastSynced: new Date(),
            hasPendingChanges: false,
            isSyncing: false
          }
        }));
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de ${table.id}:`, error);
        
        // Mettre à jour l'état
        setSyncStates(prev => ({
          ...prev,
          [table.id]: {
            ...prev[table.id],
            isSyncing: false
          }
        }));
        
        errorCount++;
      }
    }
    
    // Afficher le résultat
    if (errorCount === 0) {
      toast({
        title: "Synchronisation complète réussie",
        description: `Les ${successCount} tables ont été synchronisées avec succès.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Synchronisation partielle",
        description: `${successCount} tables synchronisées, ${errorCount} échecs.`
      });
    }
  };
  
  // Convertir une date en temps relatif
  const formatLastSynced = (date: Date | null) => {
    if (!date) return "Jamais";
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
      return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    } else {
      return `Il y a ${diffSec} seconde${diffSec > 1 ? 's' : ''}`;
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tableau de bord de synchronisation</CardTitle>
              <CardDescription>
                Gérer la synchronisation des données entre l'application et le serveur
              </CardDescription>
            </div>
            {!isOnline && (
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                <CloudOff className="h-3 w-3 mr-1" />
                Mode hors ligne
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tables">
            <TabsList className="mb-4">
              <TabsTrigger value="tables">Tables</TabsTrigger>
              <TabsTrigger value="status">État du système</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tables">
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={syncAllTables} 
                  disabled={!isOnline || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Synchroniser tout
                </Button>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Dernière synchronisation</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TABLES_TO_MONITOR.map((table) => {
                      const state = syncStates[table.id] || {
                        lastSynced: null,
                        hasPendingChanges: false,
                        isSyncing: false
                      };
                      
                      return (
                        <TableRow key={table.id}>
                          <TableCell className="font-medium">{table.name}</TableCell>
                          <TableCell>
                            {state.isSyncing ? (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Synchronisation...
                              </Badge>
                            ) : state.hasPendingChanges ? (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Modifications en attente
                              </Badge>
                            ) : state.lastSynced ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                <Check className="h-3 w-3 mr-1" />
                                Synchronisé
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                                Jamais synchronisé
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {formatLastSynced(state.lastSynced)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => forceSyncTable(table.id)}
                              disabled={state.isSyncing || !isOnline}
                            >
                              {state.isSyncing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="status">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">État de la connexion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        {isOnline ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-5 w-5 mr-2" />
                            <span className="text-lg font-medium">En ligne</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <CloudOff className="h-5 w-5 mr-2" />
                            <span className="text-lg font-medium">Hors ligne</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Modifications en attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.values(syncStates).filter(state => state.hasPendingChanges).length}
                      </div>
                      <p className="text-xs text-gray-500">
                        {Object.entries(syncStates)
                          .filter(([_, state]) => state.hasPendingChanges)
                          .map(([id]) => {
                            const table = TABLES_TO_MONITOR.find(t => t.id === id);
                            return table ? table.name : id;
                          })
                          .join(', ') || 'Aucune'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={refreshSyncStates}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rafraîchir l'état
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
