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

  useEffect(() => {
    const loadData = async () => {
      // Simuler le chargement des documents depuis une source de données
      // Remplacez ceci par votre propre logique de chargement de données
      const mockDocuments: Document[] = [
        { id: '1', nom: 'Document A', statut: 'Conforme', dateCreation: '2023-01-01', dateExpiration: '2024-01-01', type: 'Procedure', excluded: false },
        { id: '2', nom: 'Document B', statut: 'Non Conforme', dateCreation: '2023-02-01', dateExpiration: '2023-08-01', type: 'Enregistrement', excluded: false },
        { id: '3', nom: 'Document C', statut: 'Obsolete', dateCreation: '2022-01-01', dateExpiration: '2022-06-01', type: 'Mode Operatoire', excluded: false },
        { id: '4', nom: 'Document D', statut: 'A Venir', dateCreation: '2024-01-01', dateExpiration: '2025-01-01', type: 'Formulaire', excluded: false },
        { id: '5', nom: 'Document E', statut: 'Conforme', dateCreation: '2023-03-01', dateExpiration: '2024-03-01', type: 'Protocole', excluded: true },
      ];

      setDocuments(mockDocuments);

      // Calculer les statistiques à partir des documents
      if (documents) {
        const stats = calculateDocumentStats(documents);
        const statsWithExclusion = {
          ...stats,
          exclusion: stats.excluded // Assurer que nous avons la propriété "exclusion"
        };
        
        setStats(statsWithExclusion);
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
  const excludedPercentage = getPercentage(stats.excluded, stats.total);

  return {
    stats,
    conformesPercentage,
    nonConformesPercentage,
    obsoletesPercentage,
    avenirPercentage,
    excludedPercentage,
    loading,
  };
}
