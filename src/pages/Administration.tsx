
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Settings, Database, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SystemResetModal } from '@/components/admin/SystemResetModal';
import ResetSystemLink from '@/components/admin/ResetSystemLink';

const Administration = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

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
            <Button className="w-full sm:w-auto" variant="outline">
              <Database className="mr-2 h-4 w-4" />
              Vérifier l'intégrité
            </Button>
            
            <div className="pt-2">
              <ResetSystemLink className="w-full sm:w-auto" />
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
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Vérifier les mises à jour
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
