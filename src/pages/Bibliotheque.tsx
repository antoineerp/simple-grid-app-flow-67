
import React, { useState } from 'react';
import { Pencil, Trash, FileText, ChevronDown } from 'lucide-react';

interface DocumentGroup {
  id: number;
  name: string;
  expanded: boolean;
  items: Document[];
}

interface Document {
  id: number;
  name: string;
  link: string | null;
}

const Bibliotheque = () => {
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([
    { 
      id: 1, 
      name: 'Documents organisationnels', 
      expanded: false,
      items: []
    },
    { 
      id: 2, 
      name: 'Documents administratifs', 
      expanded: false,
      items: []
    }
  ]);
  
  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: 'Organigramme', link: 'Voir le document' },
    { id: 2, name: 'Administration', link: 'Voir le document' },
  ]);

  const toggleGroup = (id: number) => {
    setDocumentGroups(groups => 
      groups.map(group => 
        group.id === id ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-app-blue">Bibliothèque</h1>
          <p className="text-gray-600">Gestion des documents administratifs</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow overflow-hidden mt-6">
        <table className="w-full">
          <thead>
            <tr className="bg-app-light-blue text-left">
              <th className="w-8 py-3 px-4"></th>
              <th className="py-3 px-4 text-app-blue font-semibold">Nom du document</th>
              <th className="py-3 px-4 text-app-blue font-semibold">Lien</th>
              <th className="py-3 px-4 text-app-blue font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documentGroups.map((group) => (
              <React.Fragment key={group.id}>
                <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                  <td className="py-3 px-4 text-center">
                    <ChevronDown className={`h-4 w-4 inline-block transition-transform ${group.expanded ? 'rotate-180' : ''}`} />
                  </td>
                  <td className="py-3 px-4 font-medium">{group.name}</td>
                  <td className="py-3 px-4"></td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-gray-600 hover:text-app-blue mr-3">
                      <Pencil className="h-5 w-5 inline-block" />
                    </button>
                    <button className="text-gray-600 hover:text-red-500">
                      <Trash className="h-5 w-5 inline-block" />
                    </button>
                  </td>
                </tr>
                {group.expanded && group.items.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50 bg-gray-50">
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 pl-8">{item.name}</td>
                    <td className="py-3 px-4">
                      {item.link && <a href="#" className="text-app-blue hover:underline">{item.link}</a>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-600 hover:text-app-blue mr-3">
                        <Pencil className="h-5 w-5 inline-block" />
                      </button>
                      <button className="text-gray-600 hover:text-red-500">
                        <Trash className="h-5 w-5 inline-block" />
                      </button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4">{doc.name}</td>
                <td className="py-3 px-4">
                  {doc.link === 'Voir le document' ? (
                    <a href="#" className="text-app-blue hover:underline">
                      Voir le document
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button className="text-gray-600 hover:text-app-blue mr-3">
                    <Pencil className="h-5 w-5 inline-block" />
                  </button>
                  <button className="text-gray-600 hover:text-red-500">
                    <Trash className="h-5 w-5 inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 space-x-3">
        <button className="btn-outline">
          Nouveau groupe
        </button>
        <button className="btn-primary">
          Nouveau document
        </button>
      </div>
    </div>
  );
};

export default Bibliotheque;
