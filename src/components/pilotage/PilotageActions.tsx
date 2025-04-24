
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface PilotageActionsProps {
  onAddDocument: () => void;
}

const PilotageActions: React.FC<PilotageActionsProps> = ({ onAddDocument }) => {
  return (
    <div className="flex justify-end mt-4">
      <Button 
        className="bg-app-blue hover:bg-app-blue/90 text-white" 
        onClick={onAddDocument}
      >
        <Plus className="h-4 w-4 mr-2" /> Ajouter un document
      </Button>
    </div>
  );
};

export default PilotageActions;
