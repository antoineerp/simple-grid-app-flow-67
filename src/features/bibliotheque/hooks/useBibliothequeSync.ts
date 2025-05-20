import { useState, useCallback, useRef, useEffect } from 'react';
import { Document as BibliothequeDocument, DocumentGroup } from '@/types/bibliotheque';
import { Document as SystemDocument } from '@/types/documents';
import { syncService } from '@/services/sync/SyncService';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useSync } from '@/hooks/useSync';
import { toast } from '@/components/ui/use-toast';
import { getDatabaseConnectionCurrentUser } from '@/services/core/databaseConnectionService';

// Fonction utilitaire pour obtenir un ID utilisateur valide
const getValidUserId = (userId?: string): string => {
  // Essayer d'utiliser l'ID fourni s'il existe
  if (userId && typeof userId === 'string' && userId !== '[object Object]') {
    return userId;
  }
  
  // Sinon, essayer d'obtenir l'utilisateur courant
  try {
    const currentUser = getDatabaseConnectionCurrentUser();
    
    // Si l'utilisateur est une chaîne non vide, l'utiliser
    if (currentUser && typeof currentUser === 'string') {
      return currentUser;
    }
    
    // Si l'utilisateur est un objet, essayer d'extraire un identifiant
    if (currentUser && typeof currentUser === 'object') {
      if (currentUser.identifiant_technique) return currentUser.identifiant_technique;
      if (currentUser.email) return currentUser.email;
      if (currentUser.id) return currentUser.id;
    }
  } catch (e) {
    console.error("Erreur lors de la récupération de l'utilisateur actuel:", e);
  }
  
  // Valeur par défaut sécuritaire
  return 'default';
};

// Helper function to convert between document types
const convertSystemToBibliothequeDoc = (doc: SystemDocument): BibliothequeDocument => ({
  id: doc.id,
  name: doc.nom || '',
  link: doc.fichier_path,
  groupId: doc.groupId
});

const convertBibliothequeToSystemDoc = (doc: BibliothequeDocument): SystemDocument => ({
  id: doc.id,
  nom: doc.name || '',
  fichier_path: doc.link,
  groupId: doc.groupId,
  responsabilites: { r: [], a: [], c: [], i: [] },
  etat: null,
  date_creation: new Date(),
  date_modification: new Date()
});

export const useBibliothequeSync = () => {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();
  const { isSyncing, syncFailed, syncAndProcess } = useSync('collaboration');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSyncRef = useRef<boolean>(false);
  const documentsRef = useRef<BibliothequeDocument[]>([]);
  const groupsRef = useRef<DocumentGroup[]>([]);
  const lastChangedRef = useRef<Date | null>(null);
  
  // Fonction pour charger les documents depuis le serveur
  const loadFromServer = useCallback(async (userId?: string): Promise<BibliothequeDocument[]> => {
    // Utiliser la fonction utilitaire pour garantir un ID utilisateur valide
    const currentUser = getValidUserId(userId);
    
    if (!isOnline) {
      console.log('Mode hors ligne - chargement des documents locaux');
      try {
        // UNIQUEMENT chercher sous le nouveau nom (collaboration)
        const localData = localStorage.getItem(`collaboration_${currentUser}`);
        
        if (localData) {
          const localDocs = JSON.parse(localData);
          return localDocs.map(convertSystemToBibliothequeDoc);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des documents locaux:', e);
      }
      return [];
    }
    
    try {
      // Utiliser le service central pour charger les données
      const documents = await syncService.loadDataFromServer<SystemDocument>('collaboration', currentUser);
      const lastSyncTime = syncService.getLastSynced('collaboration');
      if (lastSyncTime) {
        setLastSynced(lastSyncTime);
      } else {
        setLastSynced(new Date());
      }
      return documents.map(convertSystemToBibliothequeDoc);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les documents du serveur. Mode hors-ligne activé.",
      });
      
      // En cas d'erreur, chargement des documents locaux comme solution de secours
      try {
        // UNIQUEMENT chercher sous le nouveau nom (collaboration)
        const localData = localStorage.getItem(`collaboration_${currentUser}`);
        
        if (localData) {
          const localDocs = JSON.parse(localData);
          return localDocs.map(convertSystemToBibliothequeDoc);
        }
      } catch (e) {
        console.error('Erreur lors du chargement des documents locaux:', e);
      }
      return [];
    }
  }, [isOnline]);

  // Effet pour déclencher la synchronisation automatique
  useEffect(() => {
    // Intervalle de vérification de synchronisation automatique toutes les 30 secondes
    const autoSyncInterval = setInterval(() => {
      if (lastChangedRef.current && documentsRef.current.length > 0 && groupsRef.current.length > 0) {
        const now = new Date();
        const timeSinceLastChange = now.getTime() - lastChangedRef.current.getTime();
        
        // Si des modifications ont été faites il y a plus de 10 secondes, synchroniser
        if (timeSinceLastChange > 10000 && !isSyncing) {
          console.log('Synchronisation automatique déclenchée');
          
          // Utiliser l'utilisateur courant
          const currentUser = getDatabaseConnectionCurrentUser() || 'default';
          
          syncWithServer(documentsRef.current, groupsRef.current, currentUser, "auto")
            .catch(err => console.error("Erreur lors de la synchronisation automatique:", err));
        }
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => clearInterval(autoSyncInterval);
  }, [isSyncing]);
  
  // Fonction pour synchroniser avec délai (debounce)
  const debounceSyncWithServer = useCallback((
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string
  ) => {
    // Toujours utiliser l'utilisateur courant si non spécifié
    const currentUser = userId || getDatabaseConnectionCurrentUser() || 'default';
    
    // Mettre à jour les références pour la synchronisation automatique
    documentsRef.current = documents;
    groupsRef.current = groups;
    lastChangedRef.current = new Date();
    
    // Toujours sauvegarder localement immédiatement
    const systemDocs = documents.map(convertBibliothequeToSystemDoc);
    localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
    localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
    
    // Marquer qu'une synchronisation est en attente
    pendingSyncRef.current = true;
    
    // Si un timeout est déjà en cours, l'annuler
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Programmer une nouvelle synchronisation après 10 secondes
    syncTimeoutRef.current = setTimeout(() => {
      if (pendingSyncRef.current && isOnline) {
        // Exécuter la synchronisation
        syncWithServer(documents, groups, currentUser, "auto").catch(err => {
          console.error("Erreur lors de la synchronisation différée:", err);
        });
        pendingSyncRef.current = false;
      }
      syncTimeoutRef.current = null;
    }, 10000); // 10 secondes de délai
    
    return true;
  }, [isOnline]);
  
  // Fonction principale de synchronisation
  const syncWithServer = useCallback(async (
    documents: BibliothequeDocument[], 
    groups: DocumentGroup[], 
    userId?: string, 
    trigger: "auto" | "manual" | "initial" = "manual"
  ): Promise<boolean> => {
    // Utiliser la fonction utilitaire pour garantir un ID utilisateur valide
    const currentUser = getValidUserId(userId);
    
    console.log(`Synchronisation pour l'utilisateur: ${currentUser}`);
    
    if (!isOnline) {
      // Mode hors ligne - enregistrement local uniquement
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
      
      if (trigger !== "auto") {
        toast({
          variant: "destructive",
          title: "Mode hors ligne",
          description: "Les modifications ont été enregistrées localement uniquement.",
        });
      }
      
      return false;
    }
    
    try {
      // Toujours enregistrer localement d'abord pour éviter la perte de données
      const systemDocs = documents.map(convertBibliothequeToSystemDoc);
      localStorage.setItem(`collaboration_${currentUser}`, JSON.stringify(systemDocs));
      localStorage.setItem(`collaboration_groups_${currentUser}`, JSON.stringify(groups));
      
      // Utiliser le service central pour la synchronisation avec la table "collaboration"
      // Correct : passer seulement les arguments requis à syncAndProcess
      const result = await syncAndProcess(systemDocs, trigger);
      
      if (result.success) {
        const lastSyncTime = syncService.getLastSynced('collaboration');
        if (lastSyncTime) {
          setLastSynced(lastSyncTime);
        } else {
          setLastSynced(new Date());
        }
        
        // Réinitialiser l'indicateur de synchronisation en attente
        pendingSyncRef.current = false;
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // L'erreur est déjà gérée dans le hook useSync
      return false;
    }
  }, [isOnline, syncAndProcess]);
  
  return {
    syncWithServer,
    debounceSyncWithServer,
    loadFromServer,
    isSyncing,
    isOnline,
    lastSynced,
    syncFailed
  };
};
