
import { useCallback } from 'react';
import { Document } from '@/types/documents';
import { useToast } from '@/hooks/use-toast';
import { useSyncService } from '@/services/core/syncService';

type UseDocumentLoadingProps = {
  userId: string | null;
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  setLoadError: React.Dispatch<React.SetStateAction<string | null>>;
  documents: Document[];
};

export const useDocumentLoading = ({
  userId,
  setDocuments,
  setLoadError,
  documents
}: UseDocumentLoadingProps) => {
  const { toast } = useToast();
  const syncService = useSyncService();
  
  // Function to load documents initially
  const loadDocuments = useCallback(async () => {
    try {
      if (!userId) {
        console.log("Pas d'utilisateur identifié, chargement des documents ignoré");
        return;
      }
      
      console.log(`Chargement des documents pour l'utilisateur: ${userId}`);
      const result = await syncService.loadFromServer<Document>({
        endpoint: 'documents-sync.php',
        loadEndpoint: 'documents-load.php',
        userId: userId,
        maxRetries: 1,
        retryDelay: 500
      });
      
      if (Array.isArray(result)) {
        setDocuments(result as Document[]);
        console.log(`${result.length} documents chargés avec succès`);
        toast({
          title: "Documents chargés",
          description: `${result.length} documents disponibles`
        });
      } else {
        console.error("Format de résultat inattendu:", result);
        // Ne pas vider les documents si le résultat est invalide mais qu'on a déjà des documents
        if (documents.length === 0) {
          setDocuments([]);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error);
      setLoadError(error instanceof Error ? error.message : "Erreur inconnue");
      toast({
        title: "Erreur de chargement",
        description: error instanceof Error ? error.message : "Erreur lors du chargement des documents",
        variant: "destructive"
      });
      // Ne pas vider les documents en cas d'erreur si on en a déjà
      if (documents.length === 0) {
        setDocuments([]);
      }
    }
  }, [userId, syncService, setDocuments, setLoadError, documents, toast]);

  const handleResetLoadAttempts = useCallback(() => {
    setLoadError(null);
    syncService.resetSyncStatus();
    
    // Réessayer le chargement
    loadDocuments();
  }, [setLoadError, syncService, loadDocuments]);

  return {
    loadDocuments,
    handleResetLoadAttempts
  };
};
