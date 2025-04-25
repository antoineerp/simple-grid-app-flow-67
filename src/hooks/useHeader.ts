
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '@/services/auth/authService';
import { isConnectedToDatabase } from '@/services/core/databaseConnectionService';
import { forceReloadUserProfile } from '@/services/sync';
import { testServerPhpExecution } from '@/services/sync/diagnostics/serverDiagnostics';
import { toast } from '@/hooks/use-toast';

export const useHeader = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [phpExecuting, setPhpExecuting] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      
      // Récupérer également le nom d'utilisateur stocké dans localStorage
      const storedUserName = localStorage.getItem('userName');
      setUserName(storedUserName);
      
      // Vérifier si PHP s'exécute correctement
      try {
        const diagnosticResult = await testServerPhpExecution();
        setPhpExecuting(diagnosticResult.phpExecuting);
        
        if (!diagnosticResult.success) {
          console.error("❌ DIAGNOSTIC - Problème avec le serveur PHP:", diagnosticResult.message);
        }
      } catch (error) {
        console.error("❌ DIAGNOSTIC - Erreur lors du test PHP:", error);
        setPhpExecuting(false);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      const connected = await isConnectedToDatabase();
      setIsDatabaseConnected(connected);
    };
    
    checkDatabaseConnection();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès"
    });
  };

  const handleForceSync = async () => {
    if (!user) {
      toast({
        title: "Synchronisation impossible",
        description: "Vous devez être connecté pour synchroniser vos données",
        variant: "destructive"
      });
      return;
    }
    
    setIsSyncing(true);
    setSyncError(false);
    
    try {
      const result = await forceReloadUserProfile();
      setLastSynced(new Date());
      
      if (result) {
        console.log("✅ Synchronisation manuelle réussie");
        toast({
          title: "Synchronisation réussie",
          description: "Vos données ont été synchronisées avec le serveur"
        });
      } else {
        console.warn("⚠️ Synchronisation manuelle sans données");
        toast({
          title: "Synchronisation terminée",
          description: "Aucune donnée n'a été trouvée sur le serveur"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la synchronisation manuelle:", error);
      setSyncError(true);
      toast({
        title: "Échec de la synchronisation",
        description: error instanceof Error ? error.message : "Erreur inconnue lors de la synchronisation",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    user,
    userName,
    isDatabaseConnected,
    isSyncing,
    lastSynced,
    syncError,
    phpExecuting,
    handleLogout,
    handleForceSync
  };
};
