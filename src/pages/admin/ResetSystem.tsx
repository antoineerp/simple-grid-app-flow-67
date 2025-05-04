
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { resetEntireSystem } from '@/services/admin/resetSystemService';
import { useToast } from '@/hooks/use-toast';

export default function ResetSystem() {
  const [isResetting, setIsResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleReset = async () => {
    if (confirmText !== 'RÉINITIALISER TOUT') {
      toast({
        title: "Confirmation incorrecte",
        description: "Veuillez saisir exactement 'RÉINITIALISER TOUT' pour confirmer",
        variant: "destructive"
      });
      return;
    }

    setIsResetting(true);
    try {
      const resetResult = await resetEntireSystem();
      console.log("Résultat de la réinitialisation:", resetResult);
      
      setResult(resetResult);
      
      if (resetResult.success) {
        toast({
          title: "Réinitialisation réussie",
          description: "Le système a été réinitialisé. Vous allez être redirigé vers la page de connexion.",
        });
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      } else {
        toast({
          title: "Échec de la réinitialisation",
          description: resetResult.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur lors de la réinitialisation:", errorMessage);
      
      toast({
        title: "Erreur",
        description: `Une erreur s'est produite: ${errorMessage}`,
        variant: "destructive"
      });
      setResult({ success: false, message: errorMessage });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Réinitialisation complète du système</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Attention: Opération dangereuse
          </CardTitle>
          <CardDescription>
            Cette opération va supprimer tous les utilisateurs et toutes les tables de l'application, 
            puis recréer un utilisateur administrateur avec l'email antcirier@gmail.com.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result ? (
            <>
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  <strong>Cette action est irréversible!</strong> Assurez-vous de sauvegarder vos données importantes avant de procéder.
                </AlertDescription>
              </Alert>
              
              <div className="border border-red-300 rounded-md p-4 bg-red-50 text-red-800 mb-4">
                <h3 className="font-bold mb-2">Conséquences de la réinitialisation:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Suppression de tous les utilisateurs existants</li>
                  <li>Suppression de toutes les tables d'utilisateurs</li>
                  <li>Création d'un nouvel administrateur antcirier@gmail.com</li>
                  <li>Création des tables pour le nouvel administrateur</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tapez "RÉINITIALISER TOUT" pour confirmer:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="RÉINITIALISER TOUT"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </>
          ) : (
            <div className={`border rounded-md p-4 ${
              result.success ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <h3 className="font-bold mb-2">{result.success ? 'Réinitialisation réussie' : 'Échec de la réinitialisation'}</h3>
              <p>{result.message}</p>
              
              {result.success && result.details && (
                <div className="mt-2">
                  <p>Nouvel utilisateur: {result.details.newUser?.email}</p>
                  <p>Tables supprimées: {result.details.tablesDeleted}</p>
                  <p>Tables créées: {result.details.tablesCreated}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!result ? (
            <Button 
              variant="destructive"
              disabled={isResetting || confirmText !== 'RÉINITIALISER TOUT'} 
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation en cours...
                </>
              ) : (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Réinitialiser le système
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => {
              if (result.success) {
                window.location.href = '/';
              } else {
                setResult(null);
                setConfirmText('');
              }
            }}>
              {result.success ? 'Aller à la page de connexion' : 'Réessayer'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
