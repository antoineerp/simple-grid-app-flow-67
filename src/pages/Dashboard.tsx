
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-blue-600">Tableau de bord</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exigences</CardTitle>
            <CardDescription>Gestion des exigences qualité</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Suivez et gérez vos exigences de conformité.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Gestion documentaire</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Organisez et maintenez votre documentation.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Ressources Humaines</CardTitle>
            <CardDescription>Gestion des équipes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Gérez les membres de votre organisation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
