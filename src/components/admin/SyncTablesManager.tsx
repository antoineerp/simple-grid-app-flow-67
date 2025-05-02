
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, ArrowUpDown, Clock, Database, AlertCircle, CheckCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { syncDiagnostic } from '@/services/sync/SyncDiagnostic';
import { syncRegistry } from '@/services/sync/SyncRegistry';
import { toast } from '@/components/ui/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSyncContext } from '@/hooks/useSyncContext';

// Interface pour le statut d'une table
interface TableStatusProps {
  normalizedName: string;
  fullName: string;
  tracked: boolean;
  hasLocalData: boolean;
  recordCount: number;
  lastSync: string | null;
  pendingSync: boolean;
  onTrackChange: (tableName: string, tracked: boolean) => void;
  onViewData: (tableName: string) => void;
}

// Composant pour afficher le statut d'une table
const TableStatus: React.FC<TableStatusProps> = ({
  normalizedName,
  fullName,
  tracked,
  hasLocalData,
  recordCount,
  lastSync,
  pendingSync,
  onTrackChange,
  onViewData
}) => {
  return (
    <TableRow>
      <TableCell className="font-medium">{normalizedName}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{fullName}</TableCell>
      <TableCell>
        <Switch
          checked={tracked}
          onCheckedChange={(checked) => onTrackChange(normalizedName, checked)}
        />
      </TableCell>
      <TableCell>
        {hasLocalData ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Database className="h-3 w-3 mr-1" />
            {recordCount} enregistrements
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
            Aucune donnée
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {lastSync ? (
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1 text-blue-500" />
            <span className="text-xs">{new Date(lastSync).toLocaleString()}</span>
          </div>
        ) : (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Jamais synchronisé
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {pendingSync ? (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        ) : hasLocalData ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            À jour
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">N/A</span>
        )}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => onViewData(fullName)}
          disabled={!hasLocalData}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

// Composant principal pour gérer les tables
const SyncTablesManager: React.FC = () => {
  const [report, setReport] = useState(syncDiagnostic.diagnoseSync());
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<string>('normalizedName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[] | null>(null);
  const { isOnline } = useNetworkStatus();
  const { syncAll } = useSyncContext();

  useEffect(() => {
    // Rafraîchir le rapport toutes les 30 secondes
    const intervalId = setInterval(() => {
      refreshReport();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Fonction pour rafraîchir le rapport
  const refreshReport = () => {
    setLoading(true);
    
    // Mettre à jour le rapport de manière asynchrone
    setTimeout(() => {
      const newReport = syncDiagnostic.diagnoseSync();
      setReport(newReport);
      setLoading(false);
    }, 100);
  };
  
  // Fonction pour modifier le suivi d'une table
  const handleTrackChange = (tableName: string, tracked: boolean) => {
    if (tracked) {
      syncRegistry.trackTable(tableName);
    } else {
      syncRegistry.untrackTable(tableName);
    }
    
    // Mettre à jour le rapport
    refreshReport();
    
    toast({
      title: tracked ? "Table suivie" : "Table ignorée",
      description: `La table "${tableName}" est maintenant ${tracked ? "suivie" : "ignorée"}.`
    });
  };
  
  // Fonction pour effectuer un tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Inverser la direction du tri
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouveau champ de tri
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Trier les tables
  const sortedTables = [...report.tables].sort((a, b) => {
    const fieldA = a[sortField as keyof typeof a];
    const fieldB = b[sortField as keyof typeof b];
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }
    
    if (typeof fieldA === 'boolean' && typeof fieldB === 'boolean') {
      return sortDirection === 'asc'
        ? (fieldA === fieldB ? 0 : fieldA ? -1 : 1)
        : (fieldA === fieldB ? 0 : fieldA ? 1 : -1);
    }
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc'
        ? fieldA - fieldB
        : fieldB - fieldA;
    }
    
    return 0;
  });
  
  // Fonction pour suivre toutes les tables
  const handleTrackAll = () => {
    const count = syncDiagnostic.trackAllTables();
    refreshReport();
  };
  
  // Fonction pour effectuer la migration des anciennes tables
  const handleMigrateOldTables = async () => {
    setLoading(true);
    try {
      await syncDiagnostic.migrateOldTables();
      refreshReport();
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour visualiser les données d'une table
  const handleViewData = (tableName: string) => {
    try {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      setSelectedTable(tableName);
      setTableData(data);
    } catch (e) {
      console.error(`Erreur lors du chargement des données de ${tableName}:`, e);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de cette table.",
        variant: "destructive"
      });
    }
  };
  
  // Fonction pour forcer la synchronisation
  const handleForceSync = async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas possible en mode hors ligne.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const results = await syncAll();
      const successCount = Object.values(results).filter(r => r).length;
      
      toast({
        title: "Synchronisation terminée",
        description: `${successCount} tables synchronisées sur ${Object.keys(results).length}.`
      });
      
      refreshReport();
    } catch (e) {
      console.error("Erreur lors de la synchronisation:", e);
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur s'est produite lors de la synchronisation des tables.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Tables de Données</CardTitle>
          <CardDescription>
            Gérez les tables qui font l'objet d'un suivi et leur synchronisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshReport} 
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Actualiser</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTrackAll}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="ml-2">Suivre tout</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMigrateOldTables}
                disabled={loading}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="ml-2">Migrer les tables</span>
              </Button>
            </div>
            <Button 
              variant={isOnline ? "default" : "outline"} 
              size="sm" 
              onClick={handleForceSync}
              disabled={loading || !isOnline}
            >
              <Database className="h-4 w-4 mr-2" />
              Synchroniser maintenant
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('normalizedName')}>
                    Table
                    {sortField === 'normalizedName' && (
                      <ArrowUpDown className={`h-3 w-3 inline ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('tracked')}>
                    Suivi
                    {sortField === 'tracked' && (
                      <ArrowUpDown className={`h-3 w-3 inline ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('recordCount')}>
                    Données
                    {sortField === 'recordCount' && (
                      <ArrowUpDown className={`h-3 w-3 inline ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead>Dernière sync</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('pendingSync')}>
                    État
                    {sortField === 'pendingSync' && (
                      <ArrowUpDown className={`h-3 w-3 inline ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                    )}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTables.map((table) => (
                  <TableStatus
                    key={table.fullName}
                    {...table}
                    onTrackChange={handleTrackChange}
                    onViewData={handleViewData}
                  />
                ))}
                {sortedTables.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Aucune table détectée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {selectedTable && tableData && (
            <div className="mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">Données de {selectedTable}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                      Fermer
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-4 rounded-md">
                      {JSON.stringify(tableData, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncTablesManager;
