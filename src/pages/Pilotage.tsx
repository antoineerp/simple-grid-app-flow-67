
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Pilotage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pilotage</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord de pilotage</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenu du pilotage en cours de chargement...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Pilotage;
