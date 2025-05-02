
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminLayout from '@/components/layouts/AdminLayout';
import SyncTablesManager from '@/components/admin/SyncTablesManager';
import { SyncDiagnostic } from '@/utils/SyncDiagnostic';
import { Gauge, Database, ArrowUpDown, List, CheckSquare } from "lucide-react";
import { toast } from '@/components/ui/use-toast';

const SyncManagementPage = () => {
  const handleTrackAllTables = () => {
    try {
      const count = SyncDiagnostic.trackAllTables();
      toast({
        title: "Suivi des tables",
        description: `${count} tables ont été mises sous suivi.`,
        variant: "default"
      });
      
      // Rafraîchir la page après une courte pause
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de l'activation des tables:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer toutes les tables. Veuillez consulter la console pour plus de détails.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Gestion de la Synchronisation</h1>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-muted-foreground">
            Gérez les tables et leurs synchronisations
          </div>
          <Button variant="outline" onClick={handleTrackAllTables} className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Activer toutes les tables
          </Button>
        </div>
        
        <Tabs defaultValue="tables">
          <TabsList className="mb-6">
            <TabsTrigger value="tables">
              <Database className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="diagnostic">
              <Gauge className="h-4 w-4 mr-2" />
              Diagnostic
            </TabsTrigger>
            <TabsTrigger value="migrations">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Migrations
            </TabsTrigger>
            <TabsTrigger value="logs">
              <List className="h-4 w-4 mr-2" />
              Journaux
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tables" className="mt-0">
            <SyncTablesManager />
          </TabsContent>
          
          <TabsContent value="diagnostic" className="mt-0">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Outils de diagnostic</h2>
              <p className="mb-4">Ces outils vous permettent de diagnostiquer et de réparer les problèmes de synchronisation.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  className="p-4 border rounded-lg hover:bg-slate-50"
                  onClick={() => SyncDiagnostic.checkSyncStatus()}
                >
                  <h3 className="text-lg font-medium">Vérifier l'état de synchronisation</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyse l'état actuel de toutes les synchronisations et affiche un rapport détaillé.
                  </p>
                </button>
                
                <button 
                  className="p-4 border rounded-lg hover:bg-slate-50"
                  onClick={() => SyncDiagnostic.repairBlockedSyncs()}
                >
                  <h3 className="text-lg font-medium">Réparer les synchronisations bloquées</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Débloque les synchronisations qui semblent être restées en état "en cours".
                  </p>
                </button>
                
                <button 
                  className="p-4 border rounded-lg hover:bg-slate-50"
                  onClick={() => SyncDiagnostic.forceFullSync()}
                >
                  <h3 className="text-lg font-medium">Forcer une synchronisation complète</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Force la synchronisation de toutes les tables avec le serveur.
                  </p>
                </button>
                
                <button 
                  className="p-4 border rounded-lg hover:bg-slate-50 bg-blue-50"
                  onClick={handleTrackAllTables}
                >
                  <h3 className="text-lg font-medium">Activer toutes les tables</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Active automatiquement le suivi pour toutes les tables détectées dans le système.
                  </p>
                </button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="migrations" className="mt-0">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Migrations et Uniformisation</h2>
              <p className="mb-4">
                Cette section permet de gérer les migrations entre les anciens et nouveaux noms de tables,
                ainsi que d'uniformiser la structure des données.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium">Migration bibliotheque → collaboration</h3>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Transfère les données des anciennes tables "bibliotheque" vers les nouvelles tables "collaboration".
                  </p>
                  <button 
                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 border border-blue-200"
                    onClick={() => {
                      const syncDiag = SyncDiagnostic;
                      syncDiag.migrateOldTables();
                    }}
                  >
                    Lancer la migration
                  </button>
                </div>
                
                <div className="p-4 border rounded-lg bg-yellow-50">
                  <h3 className="text-lg font-medium text-yellow-800">Uniformisation des noms de tables</h3>
                  <p className="text-sm text-yellow-700 mt-1 mb-3">
                    <strong>Attention:</strong> Cette opération va standardiser les noms de toutes les tables 
                    selon la convention définie. Assurez-vous d'avoir sauvegardé vos données avant de continuer.
                  </p>
                  <button 
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 border border-yellow-300"
                    onClick={() => {
                      if (confirm("Êtes-vous sûr de vouloir uniformiser les noms de tables ? Cette opération est irréversible.")) {
                        const syncDiag = SyncDiagnostic;
                        syncDiag.trackAllTables();
                        syncDiag.migrateOldTables().then(() => {
                          alert("Uniformisation terminée.");
                          // Rafraîchir la page après une courte pause
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        });
                      }
                    }}
                  >
                    Uniformiser les noms de tables
                  </button>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs" className="mt-0">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Journaux de Synchronisation</h2>
              <p className="text-muted-foreground mb-4">
                Cette fonctionnalité sera disponible dans une prochaine mise à jour.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default SyncManagementPage;
