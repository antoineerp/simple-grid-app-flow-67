
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, RefreshCw, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SystemResetModal } from './SystemResetModal';

export const AdminTools: React.FC = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Outils d'administration</CardTitle>
          <CardDescription>
            Outils de gestion du système et de la base de données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Base de données</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-gray-500">
                  Gérer et vérifier l'état des tables de la base de données
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link to="/admin/database" className="w-full">
                  <Button variant="outline" className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Gestion de la base de données
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-base text-red-600">Réinitialisation du système</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-gray-500">
                  Supprimer tous les utilisateurs et toutes les tables, puis recréer l'administrateur
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => setIsResetModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Réinitialiser le système
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>

      <SystemResetModal
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
      />
    </div>
  );
};
