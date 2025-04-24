
import { useState, useEffect } from 'react';
import { Document } from '@/types/documents';
import { calculateDocumentStats } from '@/services/documents';

interface DocumentStats {
  total: number;
  conformes: number;
  nonConformes: number;
  obsoletes: number;
  avenir: number;
  excluded: number;
  exclusion: number;
}

export default function useDocumentSummary() {
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    conformes: 0,
    nonConformes: 0,
    obsoletes: 0,
    avenir: 0,
    excluded: 0,
    exclusion: 0,
  });
  const [documents, setDocuments] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate conformity rate based on stats
  const conformityRate = stats.total > 0 
    ? Math.round((stats.conformes / stats.total) * 100) 
    : 0;

  // Map stats to expected formats for compatibility with current components
  const nonConforme = stats.nonConformes;
  const partiellementConforme = stats.avenir;
  const conforme = stats.conformes;
  const total = stats.total;
  const exclusion = stats.exclusion;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simuler le chargement des documents depuis une source de données
        // Remplacez ceci par votre propre logique de chargement de données
        const mockDocuments: Document[] = [
          { id: '1', nom: 'Document A', etat: 'C', date_creation: new Date('2023-01-01'), date_modification: new Date('2024-01-01'), responsabilites: { r: [], a: [], c: [], i: [] } },
          { id: '2', nom: 'Document B', etat: 'NC', date_creation: new Date('2023-02-01'), date_modification: new Date('2023-08-01'), responsabilites: { r: [], a: [], c: [], i: [] } },
          { id: '3', nom: 'Document C', etat: 'EX', date_creation: new Date('2022-01-01'), date_modification: new Date('2022-06-01'), responsabilites: { r: [], a: [], c: [], i: [] } },
          { id: '4', nom: 'Document D', etat: 'PC', date_creation: new Date('2024-01-01'), date_modification: new Date('2025-01-01'), responsabilites: { r: [], a: [], c: [], i: [] } },
          { id: '5', nom: 'Document E', etat: 'C', date_creation: new Date('2023-03-01'), date_modification: new Date('2024-03-01'), responsabilites: { r: [], a: [], c: [], i: [] } },
        ];

        setDocuments(mockDocuments);

        // Calculer les statistiques à partir des documents
        if (mockDocuments) {
          const calculatedStats = calculateDocumentStats(mockDocuments);
          
          // Map the document stats to our expected format
          const mappedStats: DocumentStats = {
            total: calculatedStats.total,
            conformes: calculatedStats.conforme,
            nonConformes: calculatedStats.nonConforme,
            obsoletes: 0, // Not in the original stats
            avenir: calculatedStats.partiellementConforme, // Using PC as "avenir"
            exclusion: calculatedStats.exclusion || 0,
            excluded: calculatedStats.exclusion || 0  // Use exclusion value for excluded as well
          };
          
          setStats(mappedStats);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des documents:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getPercentage = (value: number, total: number): number => {
    return total > 0 ? (value / total) * 100 : 0;
  };

  const conformesPercentage = getPercentage(stats.conformes, stats.total);
  const nonConformesPercentage = getPercentage(stats.nonConformes, stats.total);
  const obsoletesPercentage = getPercentage(stats.obsoletes, stats.total);
  const avenirPercentage = getPercentage(stats.avenir, stats.total);
  const excludedPercentage = getPercentage(stats.exclusion, stats.total); // Changed from stats.excluded to stats.exclusion

  return {
    stats,
    conformesPercentage,
    nonConformesPercentage,
    obsoletesPercentage,
    avenirPercentage,
    excludedPercentage,
    loading,
    // Add compatibility properties for DocumentSummary
    nonConforme,
    partiellementConforme,
    conforme,
    total,
    exclusion,
    conformityRate,
  };
}
