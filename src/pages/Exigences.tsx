
import React, { useState, useEffect } from 'react';
import { Pencil, Trash, FileText, Check, Plus, Minus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ResponsableSelector from '@/components/ResponsableSelector';
import { MembresProvider } from '@/contexts/MembresContext';

interface Exigence {
  id: number;
  nom: string;
  responsabilites: {
    r: string[];
    a: string[];
    c: string[];
    i: string[];
  };
  exclusion: boolean;
  atteinte: 'NC' | 'PC' | 'C' | null;
}

const ExigencesContent = () => {
  const { toast } = useToast();
  const [exigences, setExigences] = useState<Exigence[]>(() => {
    const storedExigences = localStorage.getItem('exigences');
    return storedExigences ? JSON.parse(storedExigences) : [
      { 
        id: 1, 
        nom: 'Levée du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null
      },
      { 
        id: 2, 
        nom: 'Ouverture du courrier', 
        responsabilites: { r: [], a: [], c: [], i: [] },
        exclusion: false,
        atteinte: null
      },
    ];
  });

  // Sauvegarde des exigences dans le localStorage
  useEffect(() => {
    localStorage.setItem('exigences', JSON.stringify(exigences));
  }, [exigences]);

  const [stats, setStats] = useState({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 2
  });

  // Mise à jour des statistiques quand les exigences changent
  useEffect(() => {
    const newStats = {
      exclusion: exigences.filter(e => e.exclusion).length,
      nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
      partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
      conforme: exigences.filter(e => e.atteinte === 'C').length,
      total: exigences.length
    };
    setStats(newStats);
  }, [exigences]);

  const handleResponsabiliteChange = (id: number, type: 'r' | 'a' | 'c' | 'i', values: string[]) => {
    setExigences(prev => 
      prev.map(exigence => 
        exigence.id === id 
          ? { 
              ...exigence, 
              responsabilites: { 
                ...exigence.responsabilites, 
                [type]: values
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

  // Handler pour ajouter une nouvelle exigence
  const handleAddExigence = () => {
    const newId = exigences.length > 0 
      ? Math.max(...exigences.map(e => e.id)) + 1 
      : 1;
    
    const newExigence: Exigence = {
      id: newId,
      nom: `Nouvelle exigence ${newId}`,
      responsabilites: { r: [], a: [], c: [], i: [] },
      exclusion: false,
      atteinte: null
    };
    
    setExigences(prev => [...prev, newExigence]);
    toast({
      title: "Nouvelle exigence",
      description: `L'exigence ${newId} a été ajoutée`,
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
                  <ResponsableSelector 
                    selectedInitiales={exigence.responsabilites.r}
                    onChange={(values) => handleResponsabiliteChange(exigence.id, 'r', values)}
                    type="r"
                  />
                </td>
                <td className="py-3 px-1 text-center">
                  <ResponsableSelector 
                    selectedInitiales={exigence.responsabilites.a}
                    onChange={(values) => handleResponsabiliteChange(exigence.id, 'a', values)}
                    type="a"
                  />
                </td>
                <td className="py-3 px-1 text-center">
                  <ResponsableSelector 
                    selectedInitiales={exigence.responsabilites.c}
                    onChange={(values) => handleResponsabiliteChange(exigence.id, 'c', values)}
                    type="c"
                  />
                </td>
                <td className="py-3 px-1 text-center">
                  <ResponsableSelector 
                    selectedInitiales={exigence.responsabilites.i}
                    onChange={(values) => handleResponsabiliteChange(exigence.id, 'i', values)}
                    type="i"
                  />
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
                      e.stopPropagation();
                      handleEdit(exigence.id);
                    }}
                  >
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button 
                    className="text-gray-600 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
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
          onClick={handleAddExigence}
        >
          Ajouter une exigence
        </button>
      </div>
    </div>
  );
};

// Composant wrapper pour fournir le contexte
const Exigences = () => (
  <MembresProvider>
    <ExigencesContent />
  </MembresProvider>
);

export default Exigences;
