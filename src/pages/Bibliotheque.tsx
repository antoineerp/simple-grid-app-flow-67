
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Bibliotheque = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bibliothèque</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gestion documentaire</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenu de la bibliothèque en cours de chargement...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bibliotheque;
