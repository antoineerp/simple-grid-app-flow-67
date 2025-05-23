
import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Users } from "lucide-react";

const Dashboard: React.FC = () => {
  const { currentUser, userTables, loading } = useCurrentUser();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Utilisateur actuel
            </CardTitle>
            <CardDescription>
              Informations sur l'utilisateur connecté
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{currentUser}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Identifiant technique de l'utilisateur
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tables disponibles
            </CardTitle>
            <CardDescription>
              Tables spécifiques à cet utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div>
                <div className="text-lg font-semibold">{userTables.length}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tables dans la base de données
                </div>
                {userTables.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Liste des tables:</div>
                    <ul className="text-sm space-y-1">
                      {userTables.map((table, index) => (
                        <li key={index} className="text-muted-foreground">• {table}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
