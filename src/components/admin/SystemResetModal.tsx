
import React, { useState } from 'react';
import { resetEntireSystem } from '@/services/admin/resetSystemService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SystemResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SystemResetModal: React.FC<SystemResetModalProps> = ({ open, onOpenChange }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<{ success?: boolean; message?: string; details?: any } | null>(null);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Réinitialisation complète du système
          </DialogTitle>
          <DialogDescription className="text-red-500">
            ATTENTION: Cette opération va supprimer tous les utilisateurs et toutes les données.
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {!result ? (
            <>
              <div className="border border-red-300 rounded-md p-4 bg-red-50 text-red-800">
                <h3 className="font-bold mb-2">Conséquences de la réinitialisation:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Suppression de tous les utilisateurs</li>
                  <li>Suppression de toutes les tables d'utilisateurs</li>
                  <li>Création d'un nouvel utilisateur antcirier@gmail.com</li>
                  <li>Création des tables pour ce nouvel utilisateur</li>
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
        </div>
        
        <DialogFooter>
          {!result ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                disabled={isResetting || confirmText !== 'RÉINITIALISER TOUT'} 
                onClick={handleReset}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Réinitialiser le système
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => {
              if (result.success) {
                window.location.href = '/login';
              } else {
                onOpenChange(false);
              }
            }}>
              {result.success ? 'Aller à la page de connexion' : 'Fermer'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
