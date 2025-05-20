
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import MemberList from '@/components/ressources-humaines/MemberList';
import { getMembres } from '@/services/users/membresService';
import SyncIndicator from '@/components/common/SyncIndicator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { useSyncContext } from '@/contexts/SyncContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCurrentUser } from '@/services/auth/authService';

const RessourcesHumaines = () => {
  // State management
  const [membres, setMembres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState({
    id: '',
    nom: '',
    prenom: '',
    fonction: '',
    email: '',
    telephone: ''
  });
  
  // Use global synchronization
  const { syncStates, registerSync, updateSyncState, syncAll } = useSyncContext();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  
  // Get sync state for membres
  const syncState = syncStates.membres || {
    isSyncing: false,
    lastSynced: null,
    syncFailed: false
  };
  
  const isSyncing = syncState.isSyncing;
  const lastSynced = syncState.lastSynced;
  const syncFailed = syncState.syncFailed;

  // Register for synchronization and load initial data
  useEffect(() => {
    registerSync('membres');
    loadMembres();
  }, [registerSync]);

  // Load membres from API or localStorage
  const loadMembres = async () => {
    try {
      setIsLoading(true);
      updateSyncState('membres', { isSyncing: true });
      
      // Try to get data from API
      if (isOnline) {
        try {
          const data = await getMembres(true);
          if (Array.isArray(data)) {
            setMembres(data);
            
            // Save to localStorage for offline access
            const currentUser = getCurrentUser() || 'p71x6d_system';
            localStorage.setItem(`membres_${currentUser}`, JSON.stringify(data));
            
            updateSyncState('membres', { 
              isSyncing: false,
              lastSynced: new Date(),
              syncFailed: false
            });
            
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error loading members from API:", error);
        }
      }
      
      // Fallback to localStorage if API failed or offline
      try {
        const currentUser = getCurrentUser() || 'p71x6d_system';
        const storedData = localStorage.getItem(`membres_${currentUser}`);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (Array.isArray(parsedData)) {
            setMembres(parsedData);
            updateSyncState('membres', { 
              isSyncing: false,
              syncFailed: !isOnline ? false : true
            });
          }
        } else {
          // No data in localStorage
          setMembres([]);
          updateSyncState('membres', { 
            isSyncing: false,
            syncFailed: isOnline
          });
        }
      } catch (error) {
        console.error("Error loading members from localStorage:", error);
        setMembres([]);
        updateSyncState('membres', { 
          isSyncing: false,
          syncFailed: true
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronization handler
  const handleSync = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Mode hors ligne",
        description: "La synchronisation n'est pas disponible en mode hors ligne",
        variant: "destructive"
      });
      return;
    }
    
    updateSyncState('membres', { isSyncing: true });
    
    try {
      // Save current members to localStorage
      const currentUser = getCurrentUser() || 'p71x6d_system';
      localStorage.setItem(`membres_${currentUser}`, JSON.stringify(membres));
      
      // Try to sync with server
      await syncAll();
      
      // Reload members from the API
      await loadMembres();
      
      toast({
        title: "Synchronisation réussie",
        description: "Les membres ont été synchronisés avec succès"
      });
    } catch (error) {
      console.error("Error syncing members:", error);
      
      updateSyncState('membres', {
        isSyncing: false,
        syncFailed: true
      });
      
      toast({
        title: "Erreur de synchronisation",
        description: "Impossible de synchroniser les membres",
        variant: "destructive"
      });
    }
  }, [membres, isOnline, updateSyncState, syncAll, toast]);

  // Member CRUD operations
  const handleAddMember = () => {
    setCurrentMember({
      id: '',
      nom: '',
      prenom: '',
      fonction: '',
      email: '',
      telephone: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditMember = (id) => {
    const memberToEdit = membres.find(m => m.id === id);
    if (memberToEdit) {
      setCurrentMember({
        id: memberToEdit.id || '',
        nom: memberToEdit.nom || '',
        prenom: memberToEdit.prenom || '',
        fonction: memberToEdit.fonction || '',
        email: memberToEdit.email || '',
        telephone: memberToEdit.telephone || ''
      });
      setIsDialogOpen(true);
    }
  };

  const handleDeleteMember = (id) => {
    const updatedMembers = membres.filter(m => m.id !== id);
    setMembres(updatedMembers);
    
    // Save to local storage and synchronize
    const currentUser = getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`membres_${currentUser}`, JSON.stringify(updatedMembers));
    
    if (isOnline) {
      handleSync();
    }
    
    toast({
      title: "Membre supprimé",
      description: "Le membre a été supprimé avec succès."
    });
  };

  const handleSaveMember = () => {
    const newMember = {
      ...currentMember,
      id: currentMember.id || uuidv4()
    };
    
    let updatedMembers;
    
    if (currentMember.id) {
      // Update existing member
      updatedMembers = membres.map(m => m.id === newMember.id ? newMember : m);
    } else {
      // Add new member
      updatedMembers = [...membres, newMember];
    }
    
    setMembres(updatedMembers);
    setIsDialogOpen(false);
    
    // Save to local storage and synchronize
    const currentUser = getCurrentUser() || 'p71x6d_system';
    localStorage.setItem(`membres_${currentUser}`, JSON.stringify(updatedMembers));
    
    if (isOnline) {
      handleSync();
    }
    
    toast({
      title: "Membre enregistré",
      description: `Le membre ${newMember.prenom} ${newMember.nom} a été ${currentMember.id ? 'mis à jour' : 'ajouté'}.`
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Ressources Humaines</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => toast({
              title: "Export PDF",
              description: "La fonctionnalité d'export sera disponible prochainement",
            })}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SyncIndicator 
          isSyncing={isSyncing}
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

      {isLoading || isSyncing ? (
        <div className="text-center p-8 border border-dashed rounded-md mt-4 bg-gray-50">
          <p className="text-gray-500">Chargement des membres...</p>
        </div>
      ) : membres.length > 0 ? (
        <MemberList 
          membres={membres} 
          onEdit={handleEditMember} 
          onDelete={handleDeleteMember}
        />
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
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentMember.id ? 'Modifier' : 'Ajouter'} un membre</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  id="nom"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.nom}
                  onChange={e => setCurrentMember({...currentMember, nom: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom</label>
                <input
                  id="prenom"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.prenom}
                  onChange={e => setCurrentMember({...currentMember, prenom: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label htmlFor="fonction" className="block text-sm font-medium text-gray-700">Fonction</label>
              <input
                id="fonction"
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={currentMember.fonction}
                onChange={e => setCurrentMember({...currentMember, fonction: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.email}
                  onChange={e => setCurrentMember({...currentMember, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  id="telephone"
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={currentMember.telephone}
                  onChange={e => setCurrentMember({...currentMember, telephone: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveMember}>
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RessourcesHumaines;
