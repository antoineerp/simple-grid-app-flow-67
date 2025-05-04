
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { MembresTable } from '@/components/ressources/MembresTable';
import { useMembres } from '@/contexts/MembresContext';
import MembresToolbar from '@/components/ressources/MembresToolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Users, AlertTriangle, RefreshCcw } from 'lucide-react';
import { useSyncContext } from '@/hooks/useSyncContext';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncRepairTool } from '@/utils/syncRepairTool';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const RessourcesHumaines: React.FC = () => {
  const { toast } = useToast();
  const { membres, lastSynced, isLoading, error, refreshMembres, syncFailed } = useMembres();
  const syncContext = useSyncContext();
  const { isOnline } = useNetworkStatus();
  const [repairInProgress, setRepairInProgress] = useState(false);

  // Enregistrement de la fonction de synchronisation au montage du composant
  useEffect(() => {
    if (syncContext.isInitialized()) {
      const syncMembresFunction = async () => {
        console.log("RessourcesHumaines: Synchronisation des membres demandée");
        try {
          // Utiliser refreshMembres au lieu de syncMembres directement
          await refreshMembres();
          return true;
        } catch (error) {
          console.error("Erreur lors de la synchronisation des membres:", error);
          return false;
        }
      };

      // Enregistrer la fonction de synchronisation
      syncContext.registerSyncFunction('membres', syncMembresFunction);
      console.log("RessourcesHumaines: Fonction de synchronisation des membres enregistrée");
      
      // Synchronisation initiale si nécessaire
      if (isOnline && (!lastSynced || syncFailed)) {
        console.log("RessourcesHumaines: Synchronisation initiale des membres");
        syncContext.syncAll().catch(error => {
          console.error("Erreur lors de la synchronisation initiale:", error);
        });
      }
    } else {
      console.error("RessourcesHumaines: Le contexte de synchronisation n'est pas initialisé");
    }
    
    // Nettoyage au démontage
    return () => {
      if (syncContext.isInitialized()) {
        syncContext.unregisterSyncFunction('membres');
        console.log("RessourcesHumaines: Fonction de synchronisation des membres désenregistrée");
      }
    };
  }, [syncContext, refreshMembres, lastSynced, syncFailed, isOnline]);

  const handleSyncClick = async () => {
    try {
      if (syncContext.isInitialized()) {
        toast({ title: "Synchronisation", description: "Synchronisation en cours..." });
        const success = await syncContext.syncAll();
        if (success) {
          toast({ 
            title: "Synchronisation terminée", 
            description: "Les données ont été synchronisées avec succès" 
          });
        } else {
          toast({ 
            title: "Synchronisation incomplète", 
            description: "Certaines données n'ont pas pu être synchronisées", 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Erreur", 
          description: "Le système de synchronisation n'est pas disponible", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      toast({ 
        title: "Erreur de synchronisation", 
        description: error instanceof Error ? error.message : "Erreur inconnue", 
        variant: "destructive" 
      });
    }
  };

  const handleEmergencyRepair = async () => {
    setRepairInProgress(true);
    try {
      // Exécuter la procédure de réparation complète
      await syncRepairTool.repairMemberInsertionErrors();
      
      // Attendre un peu pour que la réparation soit effective
      setTimeout(() => {
        // Actualiser la page pour recharger avec les changements
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la procédure de réparation d'urgence:", error);
      toast({
        variant: "destructive",
        title: "Échec de la réparation",
        description: "La réparation d'urgence a échoué. Essayez de recharger l'application manuellement."
      });
    } finally {
      setRepairInProgress(false);
    }
  };

  // Convertir l'erreur en string pour éviter l'erreur de type
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;
  
  // Vérifier si l'erreur concerne le problème spécifique d'ID dupliqué
  const hasDuplicateIdError = errorMessage && 
    (errorMessage.includes('Duplicate entry') || 
     errorMessage.includes('002ecca6-dc39-468d-a6ce-a1aed0264383') ||
     errorMessage.includes('Integrity constraint violation'));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Gestion des Ressources Humaines"
        description="Gérez les membres de votre équipe"
        icon={<Users className="h-6 w-6" />}
      />
      
      {hasDuplicateIdError && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Erreur de synchronisation détectée - Cliquez pour réparer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Réparer les erreurs de synchronisation</AlertDialogTitle>
              <AlertDialogDescription>
                Une erreur de duplication d'ID a été détectée. Cette procédure va nettoyer les données locales et réparer 
                l'erreur sur le serveur. L'application sera rechargée à la fin du processus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleEmergencyRepair} 
                disabled={repairInProgress}
                className="bg-red-600 hover:bg-red-700"
              >
                {repairInProgress ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Réparation en cours...
                  </>
                ) : (
                  "Lancer la réparation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <MembresToolbar 
        onSync={handleSyncClick} 
        lastSynced={lastSynced} 
        isLoading={isLoading} 
        error={errorMessage}
      />
      
      <Card>
        <MembresTable membres={membres} isLoading={isLoading} />
      </Card>
    </div>
  );
};

export default RessourcesHumaines;
