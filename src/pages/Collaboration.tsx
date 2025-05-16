
import React from 'react';

const Collaboration = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Collaboration</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          Cette page est en cours de développement. Elle permettra de gérer les collaborations et interactions entre les différents acteurs du projet.
        </p>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Fonctionnalités à venir</h2>
          <ul className="list-disc pl-5 text-blue-700">
            <li>Gestion des groupes de travail</li>
            <li>Partage de documents</li>
            <li>Communication interne</li>
            <li>Suivi des tâches collaboratives</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
