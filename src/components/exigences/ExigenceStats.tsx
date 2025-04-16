
import React from 'react';
import { ExigenceStats as ExigenceStatsType } from '@/types/exigences';

interface ExigenceStatsProps {
  stats: ExigenceStatsType;
}

const ExigenceStats: React.FC<ExigenceStatsProps> = ({ stats }) => {
  return (
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
  );
};

export default ExigenceStats;
