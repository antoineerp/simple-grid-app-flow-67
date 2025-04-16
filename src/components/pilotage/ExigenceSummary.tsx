
import React from 'react';
import { useExigenceSummary } from '@/hooks/useExigenceSummary';

const ExigenceSummary: React.FC = () => {
  const stats = useExigenceSummary();
  
  // Calculate percentage for progress bars
  const calculatePercentage = (value: number): number => {
    if (stats.total === 0) return 0;
    const nonExcludedTotal = stats.total - stats.exclusion;
    if (nonExcludedTotal === 0) return 0;
    return Math.round((value / nonExcludedTotal) * 100);
  };

  const ncPercentage = calculatePercentage(stats.nonConforme);
  const pcPercentage = calculatePercentage(stats.partiellementConforme);
  const cPercentage = calculatePercentage(stats.conforme);

  return (
    <div className="mt-8">
      <div className="bg-white rounded-md shadow p-6">
        <h2 className="text-xl font-semibold text-app-blue mb-4">Synthèse de l'atteinte des exigences</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-app-blue">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-500">{stats.exclusion}</div>
            <div className="text-sm text-gray-600">Exclusion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-app-blue">{stats.total - stats.exclusion}</div>
            <div className="text-sm text-gray-600">À évaluer</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{cPercentage}%</div>
            <div className="text-sm text-gray-600">Taux de conformité</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-red-600">Non conforme ({stats.nonConforme})</span>
              <span className="text-sm font-medium text-red-600">{ncPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${ncPercentage}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-yellow-600">Partiellement conforme ({stats.partiellementConforme})</span>
              <span className="text-sm font-medium text-yellow-600">{pcPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${pcPercentage}%` }}></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-green-600">Conforme ({stats.conforme})</span>
              <span className="text-sm font-medium text-green-600">{cPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${cPercentage}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExigenceSummary;
