
import { useState, useEffect } from 'react';
import { useSyncContext } from '@/contexts/SyncContext';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/services/auth/authService';

// Types pour les documents de bibliothèque
interface BibliothequeItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  date_creation: Date;
  date_modification: Date;
  tags?: string[];
  category?: string;
  author?: string;
}

export function useBibliotheque() {
  const [items, setItems] = useState<BibliothequeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get sync context or use fallback
  let syncContext;
  try {
    syncContext = useSyncContext();
  } catch (e) {
    console.warn("SyncContext not available, using fallback");
  }
  
  const isOnline = navigator.onLine;
  const isSyncing = false; // Nous ne montrons pas l'état de synchronisation
  
  // Créer des wrappers pour les méthodes manquantes
  const startSync = () => {
    // Utiliser le contexte si disponible, sinon ne rien faire
    if (syncContext && typeof syncContext.registerTableForSync === 'function') {
      syncContext.registerTableForSync('bibliotheque');
    } else {
      // Simplement loguer, ne pas montrer à l'utilisateur
      console.log("Synchronisation démarrée (silencieusement)");
    }
  };
  
  const endSync = (err?: string | null) => {
    // Ne fait rien, car nous ne voulons pas montrer les informations de synchronisation
    if (err) {
      console.error("Erreur de synchronisation (silencieuse):", err);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        startSync();
        
        // Récupérer l'ID de l'utilisateur actuel pour garantir l'isolation des données
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.id) {
          throw new Error("Utilisateur non authentifié");
        }
        
        const userId = currentUser.id;
        console.log("Chargement des données de la bibliothèque pour l'utilisateur:", userId);
        
        // Essayer d'utiliser le contexte de synchronisation si disponible
        let data = [];
        if (syncContext && typeof syncContext.loadData === 'function') {
          data = await syncContext.loadData<BibliothequeItem>('bibliotheque');
        } else {
          // Fallback - essayer de charger depuis localStorage
          try {
            const storedData = localStorage.getItem(`bibliotheque_${userId}`);
            if (storedData) {
              data = JSON.parse(storedData);
            }
          } catch (storageErr) {
            console.error("Erreur lors du chargement des données locales:", storageErr);
          }
        }
        
        // Convertir les dates de chaîne à objet Date
        const formattedData = data.map(item => ({
          ...item,
          date_creation: item.date_creation instanceof Date ? item.date_creation : new Date(item.date_creation),
          date_modification: item.date_modification instanceof Date ? item.date_modification : new Date(item.date_modification)
        }));
        
        setItems(formattedData);
        endSync(); // Fin de synchronisation sans erreur
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
        endSync(message); // Fin de synchronisation avec erreur
        
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les données de la bibliothèque",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sauvegarder les données
  const saveData = async (newItems: BibliothequeItem[]): Promise<boolean> => {
    try {
      setLoading(true);
      startSync();
      
      let result = false;
      
      // Utiliser le contexte de synchronisation si disponible
      if (syncContext && typeof syncContext.syncData === 'function') {
        result = await syncContext.syncData('bibliotheque', newItems);
      } else {
        // Fallback - sauvegarder dans localStorage
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id) {
          localStorage.setItem(`bibliotheque_${currentUser.id}`, JSON.stringify(newItems));
          result = true;
        } else {
          throw new Error("Utilisateur non authentifié");
        }
      }
      
      if (result) {
        setItems(newItems);
        endSync();
        
        toast({
          title: "Synchronisation réussie",
          description: "Les données de la bibliothèque ont été sauvegardées",
        });
        
        return true;
      } else {
        throw new Error("Échec de la synchronisation");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      endSync(message);
      
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les données de la bibliothèque",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un nouvel élément
  const addItem = async (item: Omit<BibliothequeItem, 'id' | 'date_creation' | 'date_modification'>): Promise<boolean> => {
    const now = new Date();
    const newItem: BibliothequeItem = {
      ...item,
      id: `bib_${Date.now().toString()}`,
      date_creation: now,
      date_modification: now
    };
    
    const newItems = [...items, newItem];
    return await saveData(newItems);
  };

  // Mettre à jour un élément
  const updateItem = async (id: string, updates: Partial<BibliothequeItem>): Promise<boolean> => {
    const now = new Date();
    const updatedItems = items.map(item => 
      item.id === id 
        ? { ...item, ...updates, date_modification: now }
        : item
    );
    
    return await saveData(updatedItems);
  };

  // Supprimer un élément
  const deleteItem = async (id: string): Promise<boolean> => {
    const filteredItems = items.filter(item => item.id !== id);
    return await saveData(filteredItems);
  };

  return {
    items,
    loading,
    error,
    isSyncing,
    isOnline,
    addItem,
    updateItem,
    deleteItem,
    saveData
  };
}
