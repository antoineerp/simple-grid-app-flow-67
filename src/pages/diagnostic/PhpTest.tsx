
import React from 'react';
import PhpExecutionTest from '@/components/diagnostic/PhpExecutionTest';
import { ServerTest } from '@/components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ApiDiagnostic from '@/components/diagnostic/ApiDiagnostic';

const PhpTest = () => {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Diagnostic du serveur</h1>
        <p className="text-muted-foreground">
          Vérification complète de l'exécution PHP, des assets et de la configuration API
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <PhpExecutionTest />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test de connexion API</CardTitle>
            </CardHeader>
            <CardContent>
              <ServerTest />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic API</CardTitle>
            </CardHeader>
            <CardContent>
              <ApiDiagnostic />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PhpTest;
