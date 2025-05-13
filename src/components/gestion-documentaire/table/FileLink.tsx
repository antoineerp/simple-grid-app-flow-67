
import React from 'react';
import { FileText } from 'lucide-react';

interface FileLinkProps {
  filePath: string;
}

const FileLink: React.FC<FileLinkProps> = ({ filePath }) => {
  if (!filePath) {
    return (
      <div className="text-gray-400">
        <FileText className="h-4 w-4 inline-block mr-1" />
        <span className="text-sm">Aucun fichier</span>
      </div>
    );
  }

  return (
    <a 
      href={filePath}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 hover:underline flex items-center"
    >
      <FileText className="h-4 w-4 mr-1" />
      <span className="text-sm truncate max-w-[200px]">
        {filePath.split('/').pop()}
      </span>
    </a>
  );
};

export default FileLink;
