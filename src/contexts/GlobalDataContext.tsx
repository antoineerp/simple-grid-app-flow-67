
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Membre } from '@/types/membres';
import { Document, DocumentGroup } from '@/types/documents';
import { getCurrentUser } from '@/services/auth/authService';

// Test data for antcirier@gmail.com
const testDataForAntcirier = {
  membres: [
    { 
      id: "ac-mem1", 
      nom: "Dupont", 
      prenom: "Jean", 
      email: "jean.dupont@formacert.fr", 
      fonction: "Formateur principal",
      userId: "p71x6d_cirier"
    },
    { 
      id: "ac-mem2", 
      nom: "Martin", 
      prenom: "Sophie", 
      email: "sophie.martin@formacert.fr", 
      fonction: "Responsable qualité",
      userId: "p71x6d_cirier"
    }
  ],
  documents: [
    { 
      id: "ac-doc1", 
      nom: "Procédure Qualité", 
      description: "Documentation des processus qualité", 
      etat: "C", 
      fichier: "procedure_qualite.pdf",
      userId: "p71x6d_cirier" 
    },
    { 
      id: "ac-doc2", 
      nom: "Plan de formation", 
      description: "Planification des formations", 
      etat: "PC", 
      fichier: "plan_formation.docx",
      userId: "p71x6d_cirier"
    },
    { 
      id: "ac-doc3", 
      nom: "Manuel d'utilisation", 
      description: "Guide pour les utilisateurs", 
      etat: "NC", 
      fichier: "manuel.pdf",
      userId: "p71x6d_cirier"
    }
  ],
  documentGroups: [
    {
      id: "ac-grp1",
      nom: "Documents qualité",
      description: "Tous les documents liés à la qualité",
      userId: "p71x6d_cirier"
    },
    {
      id: "ac-grp2",
      nom: "Documents formation",
      description: "Documents utilisés pour les formations",
      userId: "p71x6d_cirier"
    }
  ],
  bibliothequeDocuments: [
    {
      id: "ac-bibdoc1",
      titre: "Référentiel Qualiopi",
      description: "Référentiel national qualité",
      groupeId: "ac-bibgrp1",
      fichier: "referentiel_qualiopi.pdf",
      userId: "p71x6d_cirier"
    },
    {
      id: "ac-bibdoc2",
      titre: "Guide d'audit",
      description: "Guide pour réaliser l'audit interne",
      groupeId: "ac-bibgrp1",
      fichier: "guide_audit.pdf",
      userId: "p71x6d_cirier"
    },
    {
      id: "ac-bibdoc3",
      titre: "Support Formation",
      description: "Support pour les formations Qualiopi",
      groupeId: "ac-bibgrp2",
      fichier: "support_formation.pptx",
      userId: "p71x6d_cirier"
    }
  ],
  bibliothequeGroups: [
    {
      id: "ac-bibgrp1",
      nom: "Référentiels",
      description: "Documents de référence",
      ordre: 1,
      userId: "p71x6d_cirier"
    },
    {
      id: "ac-bibgrp2",
      nom: "Formations",
      description: "Supports de formation",
      ordre: 2,
      userId: "p71x6d_cirier"
    }
  ]
};

// Default test data
const defaultTestData = {
  membres: [],
  documents: [],
  documentGroups: [],
  bibliothequeDocuments: [],
  bibliothequeGroups: []
};

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
    throw new Error("useGlobalData doit être utilisé à l'intérieur d'un GlobalDataProvider");
  }
  return context;
};

// Provider du contexte
export const GlobalDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Obtenir l'identifiant utilisateur actuel
  const currentUser = getCurrentUser();
  const storagePrefix = `global_data_${currentUser?.id || 'default'}`;
  
  // Déterminer si nous utilisons les données de test pour antcirier
  const useAntcirierData = currentUser?.email === 'antcirier@gmail.com';
  
  // États pour les différents types de données
  const [membres, setMembres] = useState<Membre[]>(useAntcirierData ? testDataForAntcirier.membres : []);
  const [documents, setDocuments] = useState<Document[]>(useAntcirierData ? testDataForAntcirier.documents : []);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>(useAntcirierData ? testDataForAntcirier.documentGroups : []);
  const [bibliothequeDocuments, setBibliothequeDocuments] = useState<any[]>(useAntcirierData ? testDataForAntcirier.bibliothequeDocuments : []);
  const [bibliothequeGroups, setBibliothequeGroups] = useState<any[]>(useAntcirierData ? testDataForAntcirier.bibliothequeGroups : []);
  
  // États pour la synchronisation
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
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
      // Si nous utilisons les données de test pour antcirier, on les utilise directement
      if (useAntcirierData) {
        setMembres(testDataForAntcirier.membres);
        setDocuments(testDataForAntcirier.documents);
        setDocumentGroups(testDataForAntcirier.documentGroups);
        setBibliothequeDocuments(testDataForAntcirier.bibliothequeDocuments);
        setBibliothequeGroups(testDataForAntcirier.bibliothequeGroups);
        return;
      }
      
      // Sinon, charger depuis localStorage
      const storedMembres = localStorage.getItem(`${storagePrefix}_membres`);
      if (storedMembres) {
        setMembres(JSON.parse(storedMembres));
      }
      
      const storedDocuments = localStorage.getItem(`${storagePrefix}_documents`);
      if (storedDocuments) {
        setDocuments(JSON.parse(storedDocuments));
      }
      
      const storedDocumentGroups = localStorage.getItem(`${storagePrefix}_document_groups`);
      if (storedDocumentGroups) {
        setDocumentGroups(JSON.parse(storedDocumentGroups));
      }
      
      const storedBibliothequeDocuments = localStorage.getItem(`${storagePrefix}_bibliotheque_documents`);
      if (storedBibliothequeDocuments) {
        setBibliothequeDocuments(JSON.parse(storedBibliothequeDocuments));
      }
      
      const storedBibliothequeGroups = localStorage.getItem(`${storagePrefix}_bibliotheque_groups`);
      if (storedBibliothequeGroups) {
        setBibliothequeGroups(JSON.parse(storedBibliothequeGroups));
      }
      
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
