
import React, { useState } from 'react';
import { Pencil, Trash, FileText } from 'lucide-react';

interface Document {
  id: number;
  ordre: number;
  nom: string;
  lien: string | null;
}

const Pilotage = () => {
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, ordre: 1, nom: 'Charte institutionnelle', lien: 'Voir le document' },
    { id: 2, ordre: 2, nom: 'Objectifs stratégiques', lien: 'Aucun lien' },
    { id: 3, ordre: 3, nom: 'Objectifs opérationnels', lien: 'Voir le document' },
    { id: 4, ordre: 4, nom: 'Risques', lien: 'Aucun lien' },
  ]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Pilotage</h1>
          <p className="text-gray-600">Documents de pilotage</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <table className="w-full">
          <thead>
            <tr className="bg-app-light-blue text-left">
              <th className="py-3 px-4 text-app-blue font-semibold">Ordre</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Nom du document</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Lien</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{doc.ordre}</td>
                <td className="py-3 px-4">{doc.nom}</td>
                <td className="py-3 px-4">
                  {doc.lien === 'Voir le document' ? (
                    <a href="#" className="text-app-blue hover:underline">
                      Voir le document
                    </a>
                  ) : (
                    <span className="text-gray-500">Aucun lien</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-gray-600 hover:text-app-blue mr-3">
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button className="text-gray-600 hover:text-red-500">
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button className="btn-primary flex items-center">
          <span className="mr-1">+</span> Ajouter un document
        </button>
      </div>
    </div>
  );
};

export default Pilotage;
