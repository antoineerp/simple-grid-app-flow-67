
import { useState, useEffect } from 'react';
import { useGlobalSync } from '@/contexts/GlobalSyncContext';
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
  
  // Utiliser le contexte de synchronisation globale
  let globalSync;
  try {
    globalSync = useGlobalSync();
  } catch (e) {
    console.warn("GlobalSyncContext not available, using fallback");
  }
  
  const isOnline = globalSync?.isOnline ?? navigator.onLine;
  const isSyncing = globalSync?.isSyncing('bibliotheque') ?? false;
  
  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Informer de la synchronisation (si possible)
        if (globalSync) {
          globalSync.syncTable('bibliotheque').catch(console.error);
        }
        
        // Récupérer l'ID de l'utilisateur actuel pour garantir l'isolation des données
        const currentUser = getCurrentUser();
        
        if (!currentUser || !currentUser.id) {
          throw new Error("Utilisateur non authentifié");
        }
        
        const userId = currentUser.id;
        console.log("Chargement des données de la bibliothèque pour l'utilisateur:", userId);
        
        // Charger depuis localStorage (fallback)
        try {
          const storedData = localStorage.getItem(`bibliotheque_${userId}`);
          const data = storedData ? JSON.parse(storedData) : [];
          
          // Convertir les dates de chaîne à objet Date
          const formattedData = data.map((item: any) => ({
            ...item,
            date_creation: item.date_creation instanceof Date ? item.date_creation : new Date(item.date_creation),
            date_modification: item.date_modification instanceof Date ? item.date_modification : new Date(item.date_modification)
          }));
          
          setItems(formattedData);
        } catch (storageErr) {
          console.error("Erreur lors du chargement des données locales:", storageErr);
          throw storageErr;
        }
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(message);
        
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
      
      let result = false;
      
      // Sauvegarder dans localStorage
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id) {
        localStorage.setItem(`bibliotheque_${currentUser.id}`, JSON.stringify(newItems));
        result = true;
      } else {
        throw new Error("Utilisateur non authentifié");
      }
      
      if (result) {
        setItems(newItems);
        
        // Synchroniser via le contexte global si disponible
        if (globalSync) {
          globalSync.syncTable('bibliotheque').catch(console.error);
        }
        
        toast({
          title: "Sauvegarde réussie",
          description: "Les données de la bibliothèque ont été sauvegardées",
        });
        
        return true;
      } else {
        throw new Error("Échec de la sauvegarde");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      setError(message);
      
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
