
import React from 'react';
import { ExternalLink } from 'lucide-react';

interface FileLinkProps {
  fichier_path: string | null;
}

const FileLink: React.FC<FileLinkProps> = ({ fichier_path }) => {
  if (!fichier_path) return <span className="text-gray-500">-</span>;
  
  return (
    <a 
      href={fichier_path}
      target="_blank"
      rel="noopener noreferrer"
      className="text-app-blue hover:underline inline-flex items-center gap-1"
    >
      {fichier_path}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
};

export default FileLink;
