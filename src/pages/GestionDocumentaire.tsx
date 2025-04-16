
import React, { useState } from 'react';
import { Pencil, Trash, FileText } from 'lucide-react';

interface Document {
  id: number;
  nom: string;
  lien: string | null;
  responsabilites: {
    r: boolean;
    a: boolean;
    c: boolean;
    i: boolean;
  };
  etat: string;
}

const GestionDocumentaire = () => {
  const [documents, setDocuments] = useState<Document[]>([]);

  const [stats, setStats] = useState({
    exclusion: 0,
    nonConforme: 0,
    partiellementConforme: 0,
    conforme: 0,
    total: 3
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Gestion Documentaire</h1>
          <p className="text-gray-600">Documentation des tâches</p>
        </div>
        <FileText className="text-red-500 h-6 w-6" />
      </div>

      <div className="flex space-x-2 mb-4 mt-4">
        <div className="badge bg-gray-200 text-gray-800">
          Exclusion: {stats.exclusion}
        </div>
        <div className="badge bg-red-100 text-red-800">
          Non Conforme: {stats.nonConforme}
        </div>
        <div className="badge bg-yellow-100 text-yellow-800">
          Partiellement Conforme: {stats.partiellementConforme}
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
              <th className="py-3 px-4 text-app-blue font-semibold">Lien</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-center" colSpan={4}>
                Responsabilités
              </th>
              <th className="py-3 px-4 text-app-blue font-semibold">Exclusion</th>
              <th className="py-3 px-4 text-app-blue font-semibold">État</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
            <tr className="bg-app-light-blue text-left">
              <th className="py-2"></th>
              <th className="py-2"></th>
              <th className="py-2 px-2 text-center text-sm font-medium">R</th>
              <th className="py-2 px-2 text-center text-sm font-medium">A</th>
              <th className="py-2 px-2 text-center text-sm font-medium">C</th>
              <th className="py-2 px-2 text-center text-sm font-medium">I</th>
              <th className="py-2"></th>
              <th className="py-2 px-4 text-sm font-medium">NCPCC</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr className="border-b">
                <td colSpan={10} className="py-4 px-4 text-center text-gray-500">
                  Aucun document disponible
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{doc.nom}</td>
                  <td className="py-3 px-4">
                    {doc.lien ? (
                      <a href="#" className="text-app-blue hover:underline">
                        {doc.lien}
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {doc.responsabilites.r ? "+" : "-"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {doc.responsabilites.a ? "+" : "-"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {doc.responsabilites.c ? "+" : "-"}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {doc.responsabilites.i ? "+" : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox h-4 w-4 text-app-blue rounded"
                    />
                  </td>
                  <td className="py-3 px-4">{doc.etat}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-gray-600 hover:text-app-blue mr-3">
                      <Pencil className="h-5 w-5 inline-block" />
                    </button>
                    <button className="text-gray-600 hover:text-red-500">
                      <Trash className="h-5 w-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button className="btn-primary">
          Nouveau document
        </button>
      </div>
    </div>
  );
};

export default GestionDocumentaire;
