
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Clock, Activity } from 'lucide-react';
import { syncMonitor, SyncAttempt } from '@/features/sync/utils/syncMonitor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncHealthIndicatorProps {
  position?: 'top-right' | 'bottom-right';
  showDetails?: boolean;
}

/**
 * Composant qui affiche l'état de santé global des synchronisations
 */
const SyncHealthIndicator: React.FC<SyncHealthIndicatorProps> = ({
  position = 'bottom-right',
  showDetails = true
}) => {
  const [health, setHealth] = useState<'good' | 'warning' | 'critical'>('good');
  const [activeCount, setActiveCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState({
    recentAttempts: [] as SyncAttempt[],
    stats: { success: 0, failure: 0 },
    lastSync: { time: null as number | null, success: false }
  });

  // Mettre à jour l'état périodiquement
  useEffect(() => {
    const updateStatus = () => {
      const currentStatus = syncMonitor.getStatus();
      setHealth(currentStatus.health);
      setActiveCount(currentStatus.activeCount);
      
      // S'assurer que toutes les tentatives ont une propriété operation définie
      const typedAttempts: SyncAttempt[] = currentStatus.recentAttempts.map(attempt => ({
        ...attempt,
        operation: attempt.operation || 'unknown' // Garantir que operation est toujours défini
      }));

      setStatus({
        recentAttempts: typedAttempts,
        stats: currentStatus.stats,
        lastSync: currentStatus.lastSync
      });
    };

    // Mise à jour initiale
    updateStatus();

    // Configurer des écouteurs d'événements pour les mises à jour
    const handleSyncEvent = () => {
      updateStatus();
    };

    window.addEventListener('syncStarted', handleSyncEvent);
    window.addEventListener('syncCompleted', handleSyncEvent);
    window.addEventListener('syncFailed', handleSyncEvent);

    // Mettre à jour régulièrement (toutes les 5 secondes)
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('syncStarted', handleSyncEvent);
      window.removeEventListener('syncCompleted', handleSyncEvent);
      window.removeEventListener('syncFailed', handleSyncEvent);
      clearInterval(interval);
    };
  }, []);

  // Formatage de la date pour l'affichage
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Jamais';
    return new Date(timestamp).toLocaleTimeString();
  };

  // Déterminer la couleur et l'icône en fonction de l'état
  const getStatusColor = () => {
    if (activeCount > 0) return 'bg-blue-100 text-blue-600'; // En cours
    switch (health) {
      case 'good': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'critical': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = () => {
    if (activeCount > 0) return <RefreshCw className="animate-spin h-4 w-4" />;
    switch (health) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Positionner l'indicateur
  const positionClass = position === 'top-right'
    ? 'top-4 right-4'
    : 'bottom-4 right-4';

  return (
    <>
      <div
        className={`fixed ${positionClass} z-50 cursor-pointer`}
        onClick={() => showDetails && setIsOpen(true)}
      >
        <div
          className={`flex items-center px-3 py-2 rounded-full shadow-md ${getStatusColor()}`}
        >
          <div className="mr-2">
            {getStatusIcon()}
          </div>
          <div className="text-xs font-medium">
            {activeCount > 0 ? `Sauvegarde en cours` : 'Sauvegarde automatique activée'}
          </div>
        </div>
      </div>

      {showDetails && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>État des synchronisations</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Dernière synchronisation:</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{formatTime(status.lastSync.time)}</span>
                  {status.lastSync.time && (
                    status.lastSync.success ? 
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" /> : 
                      <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Réussies:</span>
                <span className="text-sm text-green-500">{status.stats.success}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm">Échouées:</span>
                <span className="text-sm text-red-500">{status.stats.failure}</span>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">Activité récente</h4>
                <div className="max-h-40 overflow-y-auto">
                  {status.recentAttempts.length > 0 ? (
                    <ul className="space-y-2">
                      {status.recentAttempts.map((attempt) => (
                        <li key={attempt.id} className="text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{attempt.tableName}</span>
                            <Badge
                              variant={attempt.success ? "outline" : "destructive"}
                              className="text-xs"
                            >
                              {attempt.success ? "Réussi" : "Échec"}
                            </Badge>
                          </div>
                          <div className="text-gray-500 mt-1">
                            {new Date(attempt.startTime).toLocaleTimeString()}
                            {attempt.duration && ` (${Math.round(attempt.duration / 1000)}s)`}
                          </div>
                          {attempt.error && (
                            <div className="text-red-500 mt-1 truncate max-w-[250px]">
                              {attempt.error}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 text-xs text-center py-2">
                      Aucune activité récente
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default SyncHealthIndicator;
