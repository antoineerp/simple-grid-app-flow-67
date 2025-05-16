
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Collaboration = () => {
  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">Collaboration</h1>
        <p className="text-gray-500 mb-6">Gestion des collaborations et partages</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Collaborations actives</h2>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle collaboration
          </Button>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Fonctionnalités disponibles</h2>
          <ul className="list-disc pl-5 text-blue-700">
            <li>Gestion des groupes de travail</li>
            <li>Partage de documents</li>
            <li>Communication interne</li>
            <li>Suivi des tâches collaboratives</li>
          </ul>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 border rounded hover:bg-gray-50 transition-colors">
            <h3 className="font-medium">Groupe Qualité</h3>
            <p className="text-sm text-gray-600">5 membres - 12 documents partagés</p>
          </div>
          
          <div className="p-4 border rounded hover:bg-gray-50 transition-colors">
            <h3 className="font-medium">Groupe Direction</h3>
            <p className="text-sm text-gray-600">3 membres - 8 documents partagés</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
