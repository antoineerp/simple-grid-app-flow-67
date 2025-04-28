
import React from 'react';
import { FileText, CloudSun } from 'lucide-react';
import { exportBibliothecaireDocsToPdf } from '@/services/pdfExport';
import { useToast } from '@/hooks/use-toast';
import SyncStatusIndicator from '@/components/common/SyncStatusIndicator';

interface BibliothequeHeaderProps {
  onSync: () => Promise<void>;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced?: Date;
}

export const BibliothequeHeader: React.FC<BibliothequeHeaderProps> = ({
  onSync,
  isSyncing,
  isOnline,
  lastSynced
}) => {
  const { toast } = useToast();

  const handleExportPdf = () => {
    exportBibliothecaireDocsToPdf([], []);
    toast({
      title: "Export PDF réussi",
      description: "Le document a été généré et téléchargé",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Collaboration</h1>
          <p className="text-gray-600">Gestion des documents partagés</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onSync}
            className="text-blue-600 p-2 rounded-md hover:bg-blue-50 transition-colors flex items-center"
            title="Synchroniser avec le serveur"
            disabled={isSyncing}
          >
            <CloudSun className={`h-6 w-6 stroke-[1.5] ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExportPdf}
            className="text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
            title="Exporter en PDF"
          >
            <FileText className="h-6 w-6 stroke-[1.5]" />
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <SyncStatusIndicator 
          isSyncing={isSyncing}
          isOnline={isOnline}
          lastSynced={lastSynced}
        />
      </div>
    </>
  );
};
