
import { useMemo } from 'react';
import { Exigence, ExigenceStats } from '@/types/exigences';

export const useExigenceStats = (exigences: Exigence[]): ExigenceStats => {
  const stats = useMemo(() => ({
    total: exigences.length,
    conforme: exigences.filter(e => e.atteinte === 'C').length,
    partiellementConforme: exigences.filter(e => e.atteinte === 'PC').length,
    nonConforme: exigences.filter(e => e.atteinte === 'NC').length,
    exclusion: exigences.filter(e => e.exclusion).length
  }), [exigences]);

  return stats;
};
