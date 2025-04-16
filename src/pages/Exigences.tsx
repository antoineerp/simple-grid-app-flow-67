
import React, { useState } from 'react';
import { Pencil, Trash, FileText, Check, Plus, Minus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Exigence {
  id: number;
  nom: string;
  responsabilites: {
    r: boolean;
    a: boolean;
    c: boolean;
    i: boolean;
  };
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
}

const Exigences = () => {
  const { toast } = useToast();
  const [exigences, setExigences] = useState<Exigence[]>([
    { 
      id: 1, 
      nom: 'Levée du courrier', 
      responsabilites: { r: true, a: true, c: true, i: true },
      exclusion: false,
      atteinte: null
    },
    { 
      id: 2, 
      nom: 'Ouverture du courrier', 
      responsabilites: { r: true, a: true, c: true, i: true },
      exclusion: false,
      atteinte: null
    },
  ]);

  const [stats, setStats] = useState({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 2
  });

  const handleResponsabiliteChange = (id: number, type: 'r' | 'a' | 'c' | 'i') => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { 
                ...exigence.responsabilites, 
                [type]: !exigence.responsabilites[type] 
              } 
            } 
          : exigence
      )
    );
  };

  const handleAtteinteChange = (id: number, atteinte: 'NC' | 'PC' | 'C' | null) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, atteinte } 
          : exigence
      )
    );
  };

  const handleExclusionChange = (id: number) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { ...exigence, exclusion: !exigence.exclusion } 
          : exigence
      )
    );
  };

  // Add handlers for edit and delete actions
  const handleEdit = (id: number) => {
    toast({
      title: "Modification",
      description: `Édition de l'exigence ${id}`,
    });
    // Implementation of edit functionality would go here
  };

  const handleDelete = (id: number) => {
    setExigences(prev => prev.filter(exigence => exigence.id !== id));
    toast({
      title: "Suppression",
      description: `L'exigence ${id} a été supprimée`,
    });
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Exigences</h1>
          <p className="text-gray-600">Liste des exigences</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="flex space-x-2 mb-4 mt-4">
        <div className="badge bg-gray-200 text-gray-800">
          Exclusion: {stats.exclusion}
        </div>
        <div className="badge bg-red-100 text-red-800">
          Non conforme: {stats.nonConforme}
        </div>
        <div className="badge bg-yellow-100 text-yellow-800">
          Partiellement conforme: {stats.partiellementConforme}
        </div>
        <div className="badge bg-green-100 text-green-800">
          Conforme: {stats.conforme}
        </div>
        <div className="badge bg-blue-100 text-blue-800">
          Total: {stats.total}
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-app-light-blue text-left">
              <th className="py-3 px-4 text-app-blue font-semibold">Nom</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={4}>
                Responsabilités
              </th>
              <th className="py-3 px-4 text-app-blue font-semibold">Exclusion</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={3}>
                Atteinte
              </th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
            <tr className="bg-app-light-blue text-left">
              <th className="py-2"></th>
              <th className="py-2 px-2 text-center text-sm font-medium">R</th>
              <th className="py-2 px-2 text-center text-sm font-medium">A</th>
              <th className="py-2 px-2 text-center text-sm font-medium">C</th>
              <th className="py-2 px-2 text-center text-sm font-medium">I</th>
              <th className="py-2"></th>
              <th className="py-2 px-2 text-center text-sm font-medium text-red-500">NC</th>
              <th className="py-2 px-2 text-center text-sm font-medium text-yellow-500">PC</th>
              <th className="py-2 px-2 text-center text-sm font-medium text-green-500">C</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {exigences.map((exigence) => (
              <tr key={exigence.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{exigence.nom}</td>
                
                <td className="py-3 px-1 text-center">
                  <button 
                    onClick={() => handleResponsabiliteChange(exigence.id, 'r')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {exigence.responsabilites.r ? <Plus className="h-4 w-4 inline-block" /> : <Minus className="h-4 w-4 inline-block" />}
                  </button>
                </td>
                <td className="py-3 px-1 text-center">
                  <button 
                    onClick={() => handleResponsabiliteChange(exigence.id, 'a')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {exigence.responsabilites.a ? <Plus className="h-4 w-4 inline-block" /> : <Minus className="h-4 w-4 inline-block" />}
                  </button>
                </td>
                <td className="py-3 px-1 text-center">
                  <button 
                    onClick={() => handleResponsabiliteChange(exigence.id, 'c')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {exigence.responsabilites.c ? <Plus className="h-4 w-4 inline-block" /> : <Minus className="h-4 w-4 inline-block" />}
                  </button>
                </td>
                <td className="py-3 px-1 text-center">
                  <button 
                    onClick={() => handleResponsabiliteChange(exigence.id, 'i')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {exigence.responsabilites.i ? <Plus className="h-4 w-4 inline-block" /> : <Minus className="h-4 w-4 inline-block" />}
                  </button>
                </td>
                
                <td className="py-3 px-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={exigence.exclusion}
                    onChange={() => handleExclusionChange(exigence.id)}
                    className="form-checkbox h-4 w-4 text-app-blue rounded"
                  />
                </td>

                <td className="py-3 px-1 text-center">
                  <input 
                    type="radio" 
                    name={`atteinte-${exigence.id}`}
                    checked={exigence.atteinte === 'NC'}
                    onChange={() => handleAtteinteChange(exigence.id, 'NC')}
                    className="form-radio h-4 w-4 text-red-500"
                  />
                </td>
                <td className="py-3 px-1 text-center">
                  <input 
                    type="radio" 
                    name={`atteinte-${exigence.id}`}
                    checked={exigence.atteinte === 'PC'}
                    onChange={() => handleAtteinteChange(exigence.id, 'PC')}
                    className="form-radio h-4 w-4 text-yellow-500"
                  />
                </td>
                <td className="py-3 px-1 text-center">
                  <input 
                    type="radio" 
                    name={`atteinte-${exigence.id}`}
                    checked={exigence.atteinte === 'C'}
                    onChange={() => handleAtteinteChange(exigence.id, 'C')}
                    className="form-radio h-4 w-4 text-green-500"
                  />
                </td>
                
                <td className="py-3 px-4 text-right">
                  <button 
                    className="text-gray-600 hover:text-app-blue mr-3"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row drag when clicking the button
                      handleEdit(exigence.id);
                    }}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row drag when clicking the button
                      handleDelete(exigence.id);
                    }}
                  >
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button 
          className="btn-primary"
          onClick={() => {
            toast({
              title: "Nouvelle exigence",
              description: "Ajout d'une nouvelle exigence",
            });
            // Implementation of add functionality would go here
          }}
        >
          Ajouter une exigence
        </button>
      </div>
    </div>
  );
};

export default Exigences;
