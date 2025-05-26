
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { Document } from '@/types';
import { ApiResponse } from '@/types/api';

export function useDocuments() {
  const {
    data: response,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiService.getDocuments(),
  });

  const documents: Document[] = (response as ApiResponse)?.success ? (response as ApiResponse).data : [];

  return {
    documents,
    isLoading,
    error,
    refetch
  };
}
