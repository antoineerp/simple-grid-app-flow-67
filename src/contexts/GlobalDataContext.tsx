
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { Document, DocumentGroup } from '@/types/documents';
import { getCurrentUser } from '@/services/core/databaseConnectionService';

interface GlobalDataContextType {
  // Membres (collaborateurs)
  membres: Membre[];
  setMembres: React.Dispatch<React.SetStateAction<Membre[]>>;
  
  // Documents
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  documentGroups: DocumentGroup[];
  setDocumentGroups: React.Dispatch<React.SetStateAction<DocumentGroup[]>>;
  
  // Collaboration
  collaborationDocuments: any[];
  setCollaborationDocuments: React.Dispatch<React.SetStateAction<any[]>>;
  collaborationGroups: any[];
  setCollaborationGroups: React.Dispatch<React.SetStateAction<any[]>>;
  
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
    throw new Error("useGlobalData doit être utilisé à l'intérieur d'un GlobalDataProvider");
  }
  return context;
};

// Provider du contexte
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toujours utiliser p71x6d_richard comme identifiant utilisateur
  const currentUser = 'p71x6d_richard';
  const storagePrefix = `global_data_${currentUser}`;
  
  console.log("GlobalDataProvider - Utilisateur actuel:", currentUser);
  console.log("GlobalDataProvider - Préfixe de stockage:", storagePrefix);
  
  // États pour les différents types de données
  const [membres, setMembres] = useState<Membre[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [collaborationDocuments, setCollaborationDocuments] = useState<any[]>([]);
  const [collaborationGroups, setCollaborationGroups] = useState<any[]>([]);
  
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
      localStorage.setItem(`${storagePrefix}_collaboration_documents`, JSON.stringify(collaborationDocuments));
      localStorage.setItem(`${storagePrefix}_collaboration_groups`, JSON.stringify(collaborationGroups));
      
      // Sauvegarder également l'état de synchronisation
      if (lastSynced) {
        localStorage.setItem(`${storagePrefix}_last_synced`, lastSynced.toISOString());
      }
      localStorage.setItem(`${storagePrefix}_sync_failed`, String(syncFailed));
      
      console.log('Toutes les données ont été sauvegardées dans le localStorage avec le préfixe:', storagePrefix);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    }
  };
  
  // Charger toutes les données depuis le localStorage
  const loadFromLocalStorage = () => {
    try {
      console.log('Chargement des données depuis le localStorage avec le préfixe:', storagePrefix);
      
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
      
      // Charger les documents de collaboration
      const storedCollaborationDocuments = localStorage.getItem(`${storagePrefix}_collaboration_documents`);
      if (storedCollaborationDocuments) {
        setCollaborationDocuments(JSON.parse(storedCollaborationDocuments));
      }
      
      // Charger les groupes de collaboration
      const storedCollaborationGroups = localStorage.getItem(`${storagePrefix}_collaboration_groups`);
      if (storedCollaborationGroups) {
        setCollaborationGroups(JSON.parse(storedCollaborationGroups));
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
  }, [membres, documents, documentGroups, collaborationDocuments, collaborationGroups, lastSynced, syncFailed]);
  
  // Créer l'objet de contexte avec toutes les valeurs
  const value = {
    membres,
    setMembres,
    documents,
    setDocuments,
    documentGroups,
    setDocumentGroups,
    collaborationDocuments,
    setCollaborationDocuments,
    collaborationGroups,
    setCollaborationGroups,
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
