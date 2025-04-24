
import React from 'react';
import { FilePdf } from 'lucide-react';

interface PilotageHeaderProps {
  onExport: () => void;
}

const PilotageHeader: React.FC<PilotageHeaderProps> = ({ onExport }) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h1 className="text-3xl font-bold text-app-blue">Pilotage</h1>
      </div>
      <button 
        onClick={onExport}
        className="text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors"
        title="Exporter en PDF"
      >
        <FilePdf className="h-6 w-6" />
      </button>
    </div>
  );
};

export default PilotageHeader;
