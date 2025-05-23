
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from '@/services/core/databaseConnectionService';
import { verifyUserTables, setupTableVerificationInterval } from '@/utils/userTableVerification';

interface AppSyncManagerProps {
  showControls?: boolean;
  className?: string;
  enableDebugger?: boolean;
}

export function AppSyncManager({ 
  showControls = true, 
  className = "", 
  enableDebugger = false 
}: AppSyncManagerProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  
  const userId = getCurrentUser();
  
  // Configurer la vérification périodique des tables au montage du composant
  useEffect(() => {
    if (!userId) return;
    
    // Vérifier les tables au chargement
    handleSync();
    
    // Configurer la vérification périodique (toutes les 30 minutes)
    const clearInterval = setupTableVerificationInterval(userId, 30);
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return clearInterval;
  }, [userId]);
  
  const handleSync = async () => {
    if (!userId || syncing) return;
    
    setSyncing(true);
    setStatus("syncing");
    setMessage("Synchronisation en cours...");
    
    try {
      await verifyUserTables(userId);
      
      setStatus("success");
      setMessage("Synchronisation réussie");
      setLastSync(new Date());
      
      // Réinitialiser le message après 3 secondes
      setTimeout(() => {
        if (status === "success") {
          setMessage(null);
        }
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur lors de la synchronisation");
    } finally {
      setSyncing(false);
    }
  };
  
  if (!userId) return null;
  
  if (!showControls && !message) return null;
  
  return (
    <div className={className}>
      {message && (
        <Alert variant={status === "error" ? "destructive" : "default"} className="mb-2">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      {showControls && (
        <Card className="p-2 flex justify-between items-center">
          <div className="text-sm">
            {lastSync ? (
              <span>Dernière synchronisation: {lastSync.toLocaleTimeString()}</span>
            ) : (
              <span>Aucune synchronisation récente</span>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : status === "success" ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchroniser
          </Button>
        </Card>
      )}
    </div>
  );
}
