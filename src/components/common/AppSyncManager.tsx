
import React, { useEffect, useState } from 'react';
import { validateUserId } from '@/services/core/apiInterceptor';
import { verifyUserTables, setupTableVerificationInterval } from '@/utils/userTableVerification';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CloudUpload, AlertCircle, RefreshCw } from 'lucide-react';
import { SyncDebugger } from '@/components/sync/SyncDebugger';

interface AppSyncManagerProps {
  showControls?: boolean;
  className?: string;
  enableDebugger?: boolean;
}

/**
 * Composant qui gère la synchronisation et la vérification des tables utilisateur
 */
export const AppSyncManager: React.FC<AppSyncManagerProps> = ({ 
  showControls = true, 
  className = "",
  enableDebugger = false
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    try {
      const userId = validateUserId();
      if (userId) {
        // Configurer la vérification périodique des tables
        cleanup = setupTableVerificationInterval(userId, 60); // Toutes les 60 minutes
        
        // Effectuer une vérification initiale
        handleVerifyTables();
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du gestionnaire de synchronisation:", error);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, []);
  
  const handleVerifyTables = async () => {
    try {
      setIsVerifying(true);
      setVerificationStatus('idle');
      
      const userId = validateUserId();
      const result = await verifyUserTables(userId);
      
      setVerificationStatus(result ? 'success' : 'warning');
      
      if (result) {
        toast({
          title: "Vérification des tables réussie",
          description: "Toutes les tables utilisateur sont correctement configurées.",
        });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des tables:", error);
      setVerificationStatus('error');
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const toggleDebugger = () => {
    setShowDebugger(prev => !prev);
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {verificationStatus === 'warning' && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 text-amber-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            Certaines tables utilisateur ont dû être créées. Veuillez vérifier que la synchronisation fonctionne correctement.
          </AlertDescription>
        </Alert>
      )}
      
      {verificationStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Impossible de vérifier ou de créer les tables utilisateur. Veuillez contacter l'administrateur.
          </AlertDescription>
        </Alert>
      )}
      
      {showControls && (
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleVerifyTables} 
            disabled={isVerifying}
            className="flex items-center gap-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Vérifier les tables
              </>
            )}
          </Button>
          
          {enableDebugger && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDebugger}
              className="flex items-center gap-2"
            >
              <CloudUpload className="h-4 w-4" />
              {showDebugger ? "Masquer le moniteur" : "Afficher le moniteur"}
            </Button>
          )}
        </div>
      )}
      
      {enableDebugger && showDebugger && <SyncDebugger />}
    </div>
  );
};
