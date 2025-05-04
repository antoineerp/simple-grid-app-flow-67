
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Settings, Database, RefreshCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SystemResetModal } from '@/components/admin/SystemResetModal';
import ResetSystemLink from '@/components/admin/ResetSystemLink';
import { useSyncedData } from '@/hooks/useSyncedData';

// Type pour les paramètres système
interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

const Administration = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Utiliser notre hook pour gérer les paramètres système avec synchronisation
  const {
    data: systemSettings,
    updateData: setSystemSettings,
    isSyncing,
    isOnline,
    forceReload,
    repairSync
  } = useSyncedData<SystemSetting>(
    'system_settings',
    [],
    async (userId) => {
      // Fonction de chargement des paramètres système
      console.log("Chargement des paramètres système pour", userId);
      const storedData = localStorage.getItem(`system_settings_${userId}`);
      return storedData ? JSON.parse(storedData) : [];
    },
    async (data, userId) => {
      // Fonction de sauvegarde des paramètres système
      console.log("Sauvegarde des paramètres système pour", userId);
      localStorage.setItem(`system_settings_${userId}`, JSON.stringify(data));
      return true;
    }
  );

  // Fonction pour vérifier l'intégrité de la base de données (simulée)
  const handleCheckIntegrity = () => {
    forceReload();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Administration"
        description="Gérez les paramètres système et les opérations de maintenance"
        icon={<Settings className="h-6 w-6" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Maintenance de la base de données
            </CardTitle>
            <CardDescription>
              Outils de gestion et de maintenance de la base de données
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full sm:w-auto" 
              variant="outline"
              onClick={handleCheckIntegrity}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Vérifier l'intégrité
                </>
              )}
            </Button>
            
            <div className="pt-2">
              <ResetSystemLink className="w-full sm:w-auto" />
            </div>
            
            <div className="pt-2">
              <Button 
                className="w-full sm:w-auto" 
                variant="outline"
                onClick={repairSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Réparation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Réparer la synchronisation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCcw className="mr-2 h-5 w-5" />
              Système
            </CardTitle>
            <CardDescription>
              Actions système et réinitialisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full sm:w-auto" 
              variant="outline"
              onClick={forceReload}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Vérifier les mises à jour
                </>
              )}
            </Button>
            
            <div className="pt-2">
              <Button 
                variant="destructive" 
                className="w-full sm:w-auto"
                onClick={() => setIsResetModalOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Réinitialisation (Modal)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <SystemResetModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
      />
    </div>
  );
};

export default Administration;
