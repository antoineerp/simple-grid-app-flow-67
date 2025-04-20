
import React from 'react';

const InitialLoading = () => {
  return (
    <div className="text-center mt-12 font-sans">
      <h1 className="text-2xl font-bold mb-4">Chargement de FormaCert</h1>
      <p className="text-gray-600 mb-4">
        Si cette page persiste, cela peut indiquer un problème de chargement des ressources JavaScript.
      </p>
      <ul className="list-none p-0 space-y-2">
        <li className="text-green-600">✓ Chargement de la page HTML</li>
        <li className="text-blue-600">⟳ Vérification des fichiers JavaScript</li>
      </ul>
      <p className="mt-4">
        <a href="/assets-check.php" className="text-blue-600 underline">
          Diagnostiquer les assets
        </a>
      </p>
    </div>
  );
};

export default InitialLoading;
