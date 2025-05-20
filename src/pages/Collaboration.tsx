
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useCollaboration } from '@/hooks/useCollaboration';
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from 'lucide-react';

const Collaboration = () => {
  const { 
    documents, 
    groups, 
    isSyncing, 
    isOnline, 
    syncFailed,
    setIsDialogOpen,
    setIsGroupDialogOpen
  } = useCollaboration();
  
  // Simuler les états de loading et d'erreur à partir des données disponibles
  const isLoading = isSyncing;
  const error = syncFailed ? new Error("Erreur de synchronisation") : null;
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Collaboration</CardTitle>
            <CardDescription>Travaillez ensemble sur vos projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4 space-x-2">
              <Button 
                variant="outline"
                className="hover:bg-gray-100 transition-colors"
                onClick={() => setIsGroupDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Nouveau groupe
              </Button>
              <Button 
                variant="default"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau document
              </Button>
            </div>

            {isLoading ? (
              <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-center text-gray-500">Chargement des données de collaboration...</p>
              </div>
            ) : error ? (
              <div className="p-4 border border-red-200 rounded-md bg-red-50">
                <p className="text-center text-red-500">Erreur lors du chargement des données</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents && documents.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((item) => (
                      <div key={item.id} className="border rounded-md p-4">
                        <h3 className="font-medium">{item.name || "Document sans nom"}</h3>
                        <p className="text-sm text-gray-500">{item.link || "Pas de lien"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Aucune donnée de collaboration disponible</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Collaboration;
