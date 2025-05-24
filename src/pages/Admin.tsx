
// Page Administration
import React from 'react';
import { Shield, Users, Database, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Admin() {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p>Vous n'avez pas les droits d'administration nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center mb-6">
        <Shield className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-blue-600">Administration</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Gestion des utilisateurs
            </CardTitle>
            <CardDescription>
              Gérer les comptes utilisateurs et leurs permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Gérer les utilisateurs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Base de données
            </CardTitle>
            <CardDescription>
              Configuration et maintenance de la base de données
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Configuration DB
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Paramètres système
            </CardTitle>
            <CardDescription>
              Configuration générale de l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Paramètres
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Informations système</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p><strong>Utilisateur connecté :</strong> {user?.email}</p>
          <p><strong>Rôle :</strong> {user?.role}</p>
          <p><strong>ID technique :</strong> {user?.identifiant_technique}</p>
        </div>
      </div>
    </div>
  );
}
