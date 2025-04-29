
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DbConnectionTest from "@/components/DbConnectionTest";
import { Database, RefreshCw, Save } from 'lucide-react';
import { useDataSync } from '@/hooks/useDataSync';
import DataSyncStatus from '@/components/common/DataSyncStatus';

interface TestData {
  id: string;
  name: string;
  value: string;
}

export default function DbTest() {
  const { 
    data, 
    status, 
    lastSynced, 
    lastError, 
    pendingChanges, 
    isOnline,
    syncData, 
    loadData, 
    saveLocalData 
  } = useDataSync<TestData>('test_table');

  // Charger les données au démarrage
  useEffect(() => {
    loadData({ showToast: false });
  }, [loadData]);

  // Fonction pour simuler l'ajout d'une donnée
  const handleAddData = () => {
    const newItem = {
      id: `item-${Date.now()}`,
      name: `Test Item ${Math.floor(Math.random() * 1000)}`,
      value: `Value ${Date.now()}`
    };
    
    const newData = [...data, newItem];
    saveLocalData(newData);
  };

  // Fonction pour forcer la synchronisation
  const handleSync = () => {
    syncData();
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Test de la base de données</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connexion à la base de données</CardTitle>
          </CardHeader>
          <CardContent>
            <DbConnectionTest />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test de synchronisation</CardTitle>
            <DataSyncStatus 
              status={status}
              lastSynced={lastSynced}
              lastError={lastError}
              pendingChanges={pendingChanges}
              isOnline={isOnline}
              onSync={handleSync}
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleAddData} variant="outline" disabled={!isOnline && data.length === 0}>
                  <Save className="mr-2 h-4 w-4" />
                  Ajouter une donnée
                </Button>
                <Button onClick={handleSync} disabled={!isOnline || status === 'syncing'}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                  Synchroniser
                </Button>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Données ({data.length})</h3>
                {data.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune donnée.</p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Nom</th>
                          <th className="px-4 py-2 text-left">Valeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 border-t">{item.id}</td>
                            <td className="px-4 py-2 border-t">{item.name}</td>
                            <td className="px-4 py-2 border-t">{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mt-4">
                <p>Ce panneau permet de tester le nouveau système de synchronisation des données.</p>
                <p className="mt-2">
                  <Database className="inline-block mr-1 h-4 w-4" />
                  Mode: {isOnline ? 'Connecté' : 'Hors ligne'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
