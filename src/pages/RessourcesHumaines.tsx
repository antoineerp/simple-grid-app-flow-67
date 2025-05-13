
import React, { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { MembresTable } from '@/components/ressources/MembresTable';
import { useMembres } from '@/contexts/MembresContext';
import MembresToolbar from '@/components/ressources/MembresToolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Users } from 'lucide-react';
import { useSyncContext } from '@/hooks/useSyncContext';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const RessourcesHumaines: React.FC = () => {
  const { toast } = useToast();
  const { membres, lastSynced, isLoading, error, refreshMembres, syncFailed } = useMembres();
  const syncContext = useSyncContext();
  const { isOnline } = useNetworkStatus();

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

  // Convertir l'erreur en string pour éviter l'erreur de type
  const errorMessage = error ? (error instanceof Error ? error.message : String(error)) : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Gestion des Ressources Humaines"
        description="Gérez les membres de votre équipe"
        icon={<Users className="h-6 w-6" />}
      />
      
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
