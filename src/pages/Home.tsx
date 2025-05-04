
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Users, Settings, RefreshCcw, Undo, DatabaseBackup } from "lucide-react";
import { EmergencyRepairModal } from '@/components/tools/EmergencyRepairModal';
import { SystemResetModal } from '@/components/admin/SystemResetModal';
import { resetAllLocalStorageData } from '@/utils/localStorageReset';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  
  const handleFullReset = () => {
    if (window.confirm("Cette action va supprimer toutes vos données locales. L'application sera rechargée et vous devrez vous reconnecter. Continuer ?")) {
      try {
        resetAllLocalStorageData();
        toast({
          title: "Réinitialisation effectuée",
          description: "Toutes les données locales ont été supprimées. L'application va se recharger."
        });
        
        // Attendre un peu avant de recharger
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La réinitialisation a échoué. Veuillez réessayer."
        });
      }
    }
  };

  // Forcer la valeur isAdmin à true pour tester
  // const isAdmin = true; 
  // Utiliser les informations de l'utilisateur connecté
  const isAdmin = user && (user.role === 'admin' || user.role === 'administrateur');
  
  console.log("Home - Informations utilisateur:", user);
  console.log("Home - Rôle utilisateur:", user?.role);
  console.log("Home - isAdmin:", isAdmin);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Gestion Documentaire
            </CardTitle>
            <CardDescription>
              Gérez vos documents et leurs processus associés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Accédez à tous vos documents, organisez-les et définissez les responsabilités.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/gestion-documentaire')} className="w-full">
              Accéder
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Ressources Humaines
            </CardTitle>
            <CardDescription>
              Gérez votre équipe et les membres
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consultez et modifiez les informations des membres de votre équipe.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/ressources-humaines')} className="w-full">
              Accéder
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Paramètres
            </CardTitle>
            <CardDescription>
              Configurez l'application selon vos besoins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Modifiez les paramètres de l'application et vos préférences.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/settings')} className="w-full" variant="outline">
              Accéder
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-12 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">Outils de maintenance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-700">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                Réparation d'urgence
              </CardTitle>
              <CardDescription className="text-amber-700">
                Résolvez les problèmes de synchronisation persistants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-700">
                Utilisez cet outil en cas d'erreurs de synchronisation répétées, 
                notamment avec les messages d'erreur concernant des entrées dupliquées.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setRepairModalOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Lancer la réparation
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <Undo className="h-5 w-5 mr-2 text-red-500" />
                Réinitialisation locale
              </CardTitle>
              <CardDescription className="text-red-700">
                Dernière option en cas de problèmes insolubles localement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-700">
                Supprime toutes les données locales et les paramètres de synchronisation.
                Vous devrez vous reconnecter après cette opération.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleFullReset}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Réinitialiser données locales
              </Button>
            </CardFooter>
          </Card>
          
          {/* Assurons-nous que cette section est conditionnelle et affichée pour les administrateurs */}
          {isAdmin && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-700">
                  <DatabaseBackup className="h-5 w-5 mr-2 text-purple-500" />
                  Réinitialisation système
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Réinitialisation complète du système (admin uniquement)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-700">
                  <strong>DANGER:</strong> Supprime tous les utilisateurs et toutes les tables.
                  Recrée un utilisateur initial avec des tables vides.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setResetModalOpen(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Réinitialiser le système
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
      
      {/* Modaux de réparation et de réinitialisation */}
      <EmergencyRepairModal
        open={repairModalOpen}
        onOpenChange={setRepairModalOpen}
        onComplete={() => {
          toast({
            title: "Réparation terminée",
            description: "Le processus de réparation s'est terminé avec succès."
          });
        }}
      />
      
      <SystemResetModal
        open={resetModalOpen}
        onOpenChange={setResetModalOpen}
      />
    </div>
  );
};

export default Home;
