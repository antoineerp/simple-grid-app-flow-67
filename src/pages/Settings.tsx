
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres</CardTitle>
          <CardDescription>Configuration de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">Paramètres généraux</h3>
              <p className="text-sm text-gray-500">
                Configurez les paramètres généraux de l'application
              </p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">Paramètres de synchronisation</h3>
              <p className="text-sm text-gray-500">
                Configurez les paramètres de synchronisation avec le serveur
              </p>
            </div>
            <div className="grid gap-2">
              <h3 className="text-lg font-medium">Préférences utilisateur</h3>
              <p className="text-sm text-gray-500">
                Personnalisez votre expérience utilisateur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
