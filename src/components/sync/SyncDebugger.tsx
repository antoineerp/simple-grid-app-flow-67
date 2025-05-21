
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { TableCell, TableHeader, TableRow, TableHead, TableBody, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CloudUpload, Check, XCircle, RefreshCw } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import { validateUserId } from '@/services/core/apiInterceptor';
import { forceSync, getLastSynced, hasPendingChanges } from '@/services/sync/AutoSyncService';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface SyncTableStatus {
  tableName: string;
  hasPending: boolean;
  lastSynced: Date | null;
}

export const SyncDebugger = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [tables, setTables] = useState<SyncTableStatus[]>([]);
  
  // Liste des tables à surveiller
  const tablesToMonitor = ['documents', 'exigences', 'membres', 'pilotage', 'bibliotheque'];
  
  useEffect(() => {
    // Actualiser la liste des tables à intervalles réguliers
    const refreshTables = () => {
      try {
        const userId = validateUserId();
        const currentTables: SyncTableStatus[] = [];
        
        tablesToMonitor.forEach(table => {
          const lastSyncedTimestamp = getLastSynced(table);
          currentTables.push({
            tableName: table,
            hasPending: hasPendingChanges(table, userId),
            lastSynced: lastSyncedTimestamp ? new Date(lastSyncedTimestamp) : null
          });
        });
        
        setTables(currentTables);
      } catch (error) {
        console.error("Erreur lors de la récupération du statut des tables:", error);
      }
    };
    
    refreshTables();
    const interval = setInterval(refreshTables, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleSyncAll = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      const userId = validateUserId();
      const results = await forceSync(userId);
      
      const success = Object.values(results).every(result => result === true);
      const syncedCount = Object.values(results).filter(Boolean).length;
      
      if (success) {
        toast({
          title: "Synchronisation réussie",
          description: `Toutes les tables ont été synchronisées avec succès.`,
        });
      } else {
        toast({
          variant: "warning",
          title: "Synchronisation partielle",
          description: `${syncedCount} tables sur ${Object.keys(results).length} ont été synchronisées.`,
        });
      }
      
      // Actualiser la liste des tables après la synchronisation
      const updatedTables = tables.map(table => ({
        ...table,
        hasPending: hasPendingChanges(table.tableName, userId),
        lastSynced: getLastSynced(table.tableName) ? new Date(getLastSynced(table.tableName)!) : null
      }));
      
      setTables(updatedTables);
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({
        variant: "destructive",
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };
  
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CloudUpload className="h-5 w-5" />
          Moniteur de synchronisation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table</TableHead>
              <TableHead>Modifications en attente</TableHead>
              <TableHead>Dernière synchronisation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.tableName}>
                <TableCell className="font-medium">{table.tableName}</TableCell>
                <TableCell>
                  {table.hasPending ? (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      En attente
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Synchronisé
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatDate(table.lastSynced)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSyncAll} 
          disabled={isSyncing} 
          className="w-full flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Synchronisation en cours...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Synchroniser toutes les tables
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
