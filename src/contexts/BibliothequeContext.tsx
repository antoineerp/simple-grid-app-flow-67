
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Document, DocumentGroup } from '@/types/bibliotheque';
import { loadBibliothequeFromServer, syncBibliothequeWithServer } from '@/services/bibliotheque/bibliothequeSync';
import { getCurrentUser } from '@/services/auth/authService';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface BibliothequeContextType {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  groups: DocumentGroup[];
  setGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastSynced: Date | null;
  syncWithServer: () => Promise<boolean>;
  isOnline: boolean;
  syncFailed: boolean;
  resetSyncFailed: () => void;
}

const BibliothequeContext = createContext<BibliothequeContextType | undefined>(undefined);

export const BibliothequeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [groups, setGroups] = useState<DocumentGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Fonction pour réinitialiser l'état d'échec de synchronisation
  const resetSyncFailed = () => {
    setSyncFailed(false);
    setSyncAttempts(0);
  };
  
  // Fonction pour synchroniser les données avec le serveur
  const syncWithServer = async (): Promise<boolean> => {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
      console.error("Aucun utilisateur connecté pour synchroniser");
      toast({
        title: "Erreur de synchronisation",
        description: "Vous devez être connecté pour synchroniser vos données",
        variant: "destructive",
      });
      return false;
    }
    
    if (!isOnline) {
      toast({
        title: "Mode hors-ligne",
        description: "La synchronisation est indisponible en mode hors-ligne",
        variant: "destructive",
      });
      return false;
    }
    
    // Si on est déjà en train de synchroniser, ne pas démarrer une nouvelle sync
    if (isSyncing) {
      console.log("Une synchronisation est déjà en cours");
      return false;
    }
    
    // Si on a déjà eu trop d'échecs consécutifs, bloquer la synchronisation
    if (syncFailed && syncAttempts >= 3) {
      toast({
        title: "Synchronisation bloquée",
        description: "La synchronisation a échoué plusieurs fois. Veuillez essayer plus tard ou contacter le support.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsSyncing(true);
      setError(null);
      
      // S'assurer que l'utilisateur est un identifiant valide
      const userId = typeof currentUser === 'object' ? 
        (currentUser.identifiant_technique || currentUser.email || 'p71x6d_system') : 
        currentUser;
        
      console.log(`Synchronisation de la bibliothèque pour l'utilisateur ${userId} avec ${documents.length} documents`);
      
      const success = await syncBibliothequeWithServer(documents, groups, userId);
      
      if (success) {
        setLastSynced(new Date());
        setSyncFailed(false);
        setSyncAttempts(0);
        toast({
          title: "Synchronisation réussie",
          description: "Les données ont été synchronisées avec le serveur",
        });
        return true;
      } else {
        setSyncFailed(true);
        setSyncAttempts(prev => prev + 1);
        setError("Échec de la synchronisation");
        toast({
          title: "Échec de synchronisation",
          description: "Impossible de synchroniser avec le serveur",
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMessage);
      setSyncFailed(true);
      setSyncAttempts(prev => prev + 1);
      toast({
        title: "Erreur de synchronisation",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Charger les documents au démarrage
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.warn("Aucun utilisateur connecté pour charger les documents");
          setDocuments([]);
          setGroups([]);
          setIsLoading(false);
          return;
        }
        
        // S'assurer que l'utilisateur est un identifiant valide
        const userId = typeof currentUser === 'object' ? 
          (currentUser.identifiant_technique || currentUser.email || 'p71x6d_system') : 
          currentUser;
          
        console.log("Chargement de la bibliothèque pour l'utilisateur", userId);
        
        if (isOnline) {
          try {
            setIsSyncing(true);
            const result = await loadBibliothequeFromServer(userId);
            
            if (result) {
              setDocuments(result.documents || []);
              setGroups(result.groups || []);
              setLastSynced(new Date());
              console.log("Bibliothèque chargée depuis le serveur:", result.documents.length);
            } else {
              setDocuments([]);
              setGroups([]);
            }
          } catch (err) {
            console.error("Erreur lors du chargement de la bibliothèque depuis le serveur:", err);
            setError(err instanceof Error ? err.message : "Erreur inconnue");
            // Si erreur, initialiser avec un tableau vide
            setDocuments([]);
            setGroups([]);
            setSyncFailed(true);
            setSyncAttempts(prev => prev + 1);
          } finally {
            setIsSyncing(false);
          }
        } else {
          toast({
            title: "Mode hors-ligne",
            description: "Vous êtes en mode hors-ligne. Les données peuvent ne pas être à jour.",
            variant: "default",
          });
          // Initialiser avec un tableau vide en mode hors ligne
          setDocuments([]);
          setGroups([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        console.error("Erreur lors du chargement de la bibliothèque:", errorMessage);
        // Si erreur, initialiser avec un tableau vide
        setDocuments([]);
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocuments();
    
  }, [isOnline]);
  
  return (
    <BibliothequeContext.Provider value={{
      documents,
      setDocuments,
      groups,
      setGroups,
      isLoading,
      isSyncing,
      error,
      lastSynced,
      syncWithServer,
      isOnline,
      syncFailed,
      resetSyncFailed
    }}>
      {children}
    </BibliothequeContext.Provider>
  );
};

export const useBibliotheque = (): BibliothequeContextType => {
  const context = useContext(BibliothequeContext);
  if (context === undefined) {
    throw new Error('useBibliotheque must be used within a BibliothequeProvider');
  }
  return context;
};
