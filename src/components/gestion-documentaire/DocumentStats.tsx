
import React from 'react';
import type { DocumentStats } from '@/types/documents';

interface DocumentStatsProps {
  stats: DocumentStats;
}

const DocumentStatusDisplay: React.FC<DocumentStatsProps> = ({ stats }) => {
  return (
    <div className="flex space-x-2 mb-4 mt-2">
      <div className="badge bg-gray-200 text-gray-800 p-1.5 rounded">
        Exclusion: {stats.exclusion}
      </div>
      <div className="badge bg-red-100 text-red-800 p-1.5 rounded">
        Non Conforme: {stats.nonConforme}
      </div>
      <div className="badge bg-yellow-100 text-yellow-800 p-1.5 rounded">
        Partiellement Conforme: {stats.partiellementConforme}
      </div>
      <div className="badge bg-green-100 text-green-800 p-1.5 rounded">
        Conforme: {stats.conforme}
      </div>
      <div className="badge bg-blue-100 text-blue-800 p-1.5 rounded">
        Total: {stats.total}
      </div>
    </div>
  );
};

export default DocumentStatusDisplay;
