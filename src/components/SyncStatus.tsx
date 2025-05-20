
import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncStatusProps {
  lastSynced: Date | null;
  isSyncing?: boolean;
  syncFailed?: boolean;
  className?: string;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ 
  lastSynced, 
  isSyncing = false, 
  syncFailed = false,
  className = ""
}) => {
  if (!lastSynced) {
    return null;
  }

  let statusText = "";
  let statusIcon = null;
  let statusClass = "";

  if (syncFailed) {
    statusText = "Erreur de synchronisation";
    statusIcon = <AlertCircle className="h-4 w-4 text-red-500" />;
    statusClass = "text-red-500";
  } else if (isSyncing) {
    statusText = "Synchronisation en cours...";
    statusIcon = <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
    statusClass = "text-blue-500";
  } else {
    try {
      const formattedDate = format(
        new Date(lastSynced),
        "dd MMM à HH:mm",
        { locale: fr }
      );
      statusText = `Synchronisé le ${formattedDate}`;
      statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />;
      statusClass = "text-gray-500";
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
      statusText = "Date de synchronisation invalide";
      statusIcon = <AlertCircle className="h-4 w-4 text-yellow-500" />;
      statusClass = "text-yellow-500";
    }
  }

  return (
    <div className={`flex items-center space-x-1.5 text-xs ${statusClass} ${className}`}>
      {statusIcon}
      <span>{statusText}</span>
    </div>
  );
};

export default SyncStatus;
