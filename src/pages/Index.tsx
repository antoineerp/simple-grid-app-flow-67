
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, FileCheck, FileText, Users, BookOpen } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const modules = [
    {
      name: 'Pilotage',
      description: 'Documents de pilotage',
      icon: BarChart2,
      path: '/pilotage',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Exigences',
      description: 'Liste des exigences',
      icon: FileCheck,
      path: '/exigences',
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Gestion Documentaire',
      description: 'Documentation des tâches',
      icon: FileText,
      path: '/gestion-documentaire',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      name: 'Ressources Humaines',
      description: 'Collaborateurs/trices du projet',
      icon: Users,
      path: '/ressources-humaines',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      name: 'Bibliothèque',
      description: 'Gestion des documents administratifs',
      icon: BookOpen,
      path: '/bibliotheque',
      color: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-app-blue mb-8">Tableau de bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(module.path)}
          >
            <div className={`rounded-full w-12 h-12 flex items-center justify-center mb-4 ${module.color}`}>
              <module.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{module.name}</h2>
            <p className="text-gray-600">{module.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
