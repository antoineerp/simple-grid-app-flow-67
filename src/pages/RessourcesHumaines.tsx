
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from 'lucide-react';

const RessourcesHumaines = () => {
  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-blue-600">Ressources Humaines</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Gestion des membres</CardTitle>
          <CardDescription>Gérez les membres de votre organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Cette section permet de gérer les membres de votre équipe et leurs rôles.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RessourcesHumaines;
