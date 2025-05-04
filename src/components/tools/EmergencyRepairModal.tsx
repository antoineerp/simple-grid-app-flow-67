
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { syncRepairTool } from '@/utils/syncRepairTool';
import { resetMembersLocalStorage, resetDeviceId } from '@/utils/localStorageReset';
import { useToast } from '@/hooks/use-toast';

interface EmergencyRepairModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export const EmergencyRepairModal: React.FC<EmergencyRepairModalProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('init');
  const [isRepairing, setIsRepairing] = useState(false);
  const { toast } = useToast();

  const updateProgress = (value: number, currentStep: string) => {
    setProgress(value);
    setStep(currentStep);
  };

  const handleRepair = async () => {
    if (isRepairing) return;
    
    setIsRepairing(true);
    updateProgress(5, 'start');
    
    try {
      // Étape 1: Réinitialiser les données locales des membres
      updateProgress(10, 'reset_local');
      await new Promise(resolve => setTimeout(resolve, 500));
      resetMembersLocalStorage();
      
      // Étape 2: Générer un nouvel identifiant d'appareil
      updateProgress(20, 'reset_device_id');
      await new Promise(resolve => setTimeout(resolve, 500));
      resetDeviceId();
      
      // Étape 3: Réparer l'ID problématique
      updateProgress(30, 'fix_problem_id');
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncRepairTool.repairProblemId();
      
      // Étape 4: Supprimer les duplications
      updateProgress(50, 'remove_duplicates');
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncRepairTool.removeDuplicates();
      
      // Étape 5: Vérifier et réparer les tables
      updateProgress(70, 'repair_tables');
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncRepairTool.checkAndRepairTables();
      
      // Étape 6: Réinitialiser la file d'attente
      updateProgress(85, 'reset_queue');
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncRepairTool.resetSyncQueue();
      
      // Étape 7: Réparer l'historique de synchronisation
      updateProgress(95, 'repair_history');
      await new Promise(resolve => setTimeout(resolve, 500));
      await syncRepairTool.repairSyncHistory();
      
      // Étape finale: Terminer
      updateProgress(100, 'complete');
      
      toast({
        title: "Réparation terminée",
        description: "Les problèmes de synchronisation ont été réparés. L'application va se recharger."
      });
      
      // Attendre un peu avant de fermer le modal et recharger
      setTimeout(() => {
        onOpenChange(false);
        onComplete();
        // Recharger la page
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Erreur lors de la réparation d'urgence:", error);
      toast({
        variant: "destructive",
        title: "Erreur de réparation",
        description: "Une erreur s'est produite pendant la réparation. Veuillez réessayer."
      });
      setIsRepairing(false);
    }
  };

  const getStepMessage = () => {
    switch (step) {
      case 'init':
        return "Prêt à démarrer la réparation";
      case 'start':
        return "Démarrage de la procédure de réparation...";
      case 'reset_local':
        return "Nettoyage des données locales...";
      case 'reset_device_id':
        return "Génération d'un nouvel identifiant d'appareil...";
      case 'fix_problem_id':
        return "Correction de l'ID problématique...";
      case 'remove_duplicates':
        return "Suppression des entrées dupliquées...";
      case 'repair_tables':
        return "Vérification et réparation des tables de données...";
      case 'reset_queue':
        return "Réinitialisation de la file d'attente de synchronisation...";
      case 'repair_history':
        return "Réparation de l'historique de synchronisation...";
      case 'complete':
        return "Réparation terminée avec succès!";
      default:
        return "Procédure de réparation en cours...";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Réparation d'urgence de synchronisation
          </DialogTitle>
          <DialogDescription>
            Cette procédure va tenter de résoudre les problèmes persistants de synchronisation,
            particulièrement les erreurs de duplication d'ID.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Progress value={progress} className="h-2 mb-4" />
          <p className="text-sm text-muted-foreground">{getStepMessage()}</p>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isRepairing && progress > 0 && progress < 100}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleRepair}
            disabled={isRepairing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRepairing ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                Réparation en cours...
              </>
            ) : (
              "Démarrer la réparation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
