
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  return (
    <div className="container px-4 py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord</CardTitle>
          <CardDescription>Vue d'ensemble de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Gérez vos documents et fichiers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Exigences</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Suivez les exigences du projet</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Pilotage</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Visualisez les données de pilotage</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
