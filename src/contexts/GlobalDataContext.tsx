
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { Document, DocumentGroup } from '@/types/documents';
import { getCurrentUser } from '@/services/auth/authService';

interface GlobalDataContextType {
  // Membres (collaborateurs)
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  
  // Documents
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  documentGroups: DocumentGroup[];
  setDocumentGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>;
  
  // Bibliothèque
  bibliothequeDocuments: any[];
  setBibliothequeDocuments: React.Dispatch<React.SetStateAction<any[]>>;
  bibliothequeGroups: any[];
  setBibliothequeGroups: React.Dispatch<React.SetStateAction<any[]>>;
  
  // État de synchronisation
  lastSynced: Date | null;
  setLastSynced: React.Dispatch<React.SetStateAction<Date | null>>;
  syncFailed: boolean;
  setSyncFailed: React.Dispatch<React.SetStateAction<boolean>>;
  isSyncing: boolean;
  setIsSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Méthodes utilitaires
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

// Création du contexte avec des valeurs par défaut
const GlobalDataContext = createContext<GlobalDataContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData doit être utilisé à l'intérieur d'un GlobalDataProvider');
  }
  return context;
};

// Provider du contexte
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtenir l'identifiant utilisateur actuel
  const currentUser = getCurrentUser() || 'p71x6d_system';
  const storagePrefix = `global_data_${currentUser}`;
  
  // États pour les différents types de données
  const [membres, setMembres] = useState<Membre[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [bibliothequeDocuments, setBibliothequeDocuments] = useState<any[]>([]);
  const [bibliothequeGroups, setBibliothequeGroups] = useState<any[]>([]);
  
  // États pour la synchronisation
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncFailed, setSyncFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  // Sauvegarder toutes les données dans le localStorage
  const saveToLocalStorage = () => {
    try {
      localStorage.setItem(`${storagePrefix}_membres`, JSON.stringify(membres));
      localStorage.setItem(`${storagePrefix}_documents`, JSON.stringify(documents));
      localStorage.setItem(`${storagePrefix}_document_groups`, JSON.stringify(documentGroups));
      localStorage.setItem(`${storagePrefix}_bibliotheque_documents`, JSON.stringify(bibliothequeDocuments));
      localStorage.setItem(`${storagePrefix}_bibliotheque_groups`, JSON.stringify(bibliothequeGroups));
      
      // Sauvegarder également l'état de synchronisation
      if (lastSynced) {
        localStorage.setItem(`${storagePrefix}_last_synced`, lastSynced.toISOString());
      }
      localStorage.setItem(`${storagePrefix}_sync_failed`, String(syncFailed));
      
      console.log('Toutes les données ont été sauvegardées dans le localStorage');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };
  
  // Charger toutes les données depuis le localStorage
  const loadFromLocalStorage = () => {
    try {
      // Charger les membres
      const storedMembres = localStorage.getItem(`${storagePrefix}_membres`);
      if (storedMembres) {
        setMembres(JSON.parse(storedMembres));
      }
      
      // Charger les documents
      const storedDocuments = localStorage.getItem(`${storagePrefix}_documents`);
      if (storedDocuments) {
        setDocuments(JSON.parse(storedDocuments));
      }
      
      // Charger les groupes de documents
      const storedDocumentGroups = localStorage.getItem(`${storagePrefix}_document_groups`);
      if (storedDocumentGroups) {
        setDocumentGroups(JSON.parse(storedDocumentGroups));
      }
      
      // Charger les documents de la bibliothèque
      const storedBibliothequeDocuments = localStorage.getItem(`${storagePrefix}_bibliotheque_documents`);
      if (storedBibliothequeDocuments) {
        setBibliothequeDocuments(JSON.parse(storedBibliothequeDocuments));
      }
      
      // Charger les groupes de la bibliothèque
      const storedBibliothequeGroups = localStorage.getItem(`${storagePrefix}_bibliotheque_groups`);
      if (storedBibliothequeGroups) {
        setBibliothequeGroups(JSON.parse(storedBibliothequeGroups));
      }
      
      // Charger l'état de synchronisation
      const storedLastSynced = localStorage.getItem(`${storagePrefix}_last_synced`);
      if (storedLastSynced) {
        setLastSynced(new Date(storedLastSynced));
      }
      
      const storedSyncFailed = localStorage.getItem(`${storagePrefix}_sync_failed`);
      if (storedSyncFailed) {
        setSyncFailed(storedSyncFailed === 'true');
      }
      
      console.log('Toutes les données ont été chargées depuis le localStorage');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };
  
  // Charger les données au montage du composant
  useEffect(() => {
    loadFromLocalStorage();
  }, []);
  
  // Sauvegarder les données lorsqu'elles changent
  useEffect(() => {
    saveToLocalStorage();
  }, [membres, documents, documentGroups, bibliothequeDocuments, bibliothequeGroups, lastSynced, syncFailed]);
  
  // Créer l'objet de contexte avec toutes les valeurs
  const value = {
    membres,
    setMembres,
    documents,
    setDocuments,
    documentGroups,
    setDocumentGroups,
    bibliothequeDocuments,
    setBibliothequeDocuments,
    bibliothequeGroups,
    setBibliothequeGroups,
    lastSynced,
    setLastSynced,
    syncFailed,
    setSyncFailed,
    isSyncing,
    setIsSyncing,
    saveToLocalStorage,
    loadFromLocalStorage
  };
  
  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
};

// Créer un HOC (Higher Order Component) pour envelopper les composants qui ont besoin d'accéder aux données globales
export function withGlobalData<Props extends {}>(Component: React.ComponentType<Props>) {
  return function WithGlobalData(props: Props) {
    return (
      <GlobalDataProvider>
        <Component {...props} />
      </GlobalDataProvider>
    );
  };
}
