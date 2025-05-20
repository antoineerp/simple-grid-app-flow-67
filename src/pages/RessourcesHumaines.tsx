
import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import MemberList from '@/components/ressources-humaines/MemberList';
import { getMembres } from '@/services/users/membresService';
import SyncIndicator from '@/components/common/SyncIndicator';

const RessourcesHumaines = () => {
  const [membres, setMembres] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [syncFailed, setSyncFailed] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [lastSynced, setLastSynced] = React.useState(null);
  
  const { toast } = useToast();

  const loadMembres = async () => {
    try {
      setIsLoading(true);
      const data = await getMembres(true);
      setMembres(data);
      setIsLoading(false);
      setSyncFailed(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setIsLoading(false);
      setSyncFailed(true);
    }
  };

  React.useEffect(() => {
    loadMembres();
    
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleExportPdf = () => {
    toast({
      title: "Export PDF",
      description: "La fonctionnalité d'export sera disponible prochainement",
    });
  };

  const handleAddMember = () => {
    toast({
      title: "Ajouter un membre",
      description: "La fonctionnalité d'ajout de membre sera disponible prochainement",
    });
  };

  // Create a wrapper function that returns Promise<void> for SyncIndicator
  const handleSync = async () => {
    await loadMembres();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isLoading}
          isOnline={isOnline}
          syncFailed={syncFailed}
          lastSynced={lastSynced}
          onSync={handleSync}
          showOnlyErrors={true}
        />
      </div>

      {syncFailed && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur de synchronisation</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <div>Une erreur est survenue lors de la synchronisation des membres</div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              className="ml-4"
            >
              Réessayer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des membres...</p>
        </div>
      ) : membres.length > 0 ? (
        <MemberList membres={membres} onEdit={() => {}} onDelete={() => {}} />
      ) : (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Aucun membre trouvé. Cliquez sur "Ajouter un membre" pour commencer.</p>
        </div>
      )}
      
      <div className="flex justify-end mt-4">
        <Button 
          variant="default"
          onClick={handleAddMember}
        >
          Ajouter un membre
        </Button>
      </div>
    </div>
  );
};

export default RessourcesHumaines;
