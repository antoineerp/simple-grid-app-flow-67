
import { useState } from 'react';
import { useJsonTest } from './useJsonTest';
import { useConfigOperations } from './useConfigOperations';
import { ApiConfig } from '@/types/api-config';

export const useApiConfig = () => {
  const [config, setConfig] = useState<ApiConfig>({
    api_urls: {
      development: 'http://localhost:8080/api',
      production: 'https://qualiopi.ch/api'
    },
    allowed_origins: {
      development: 'http://localhost:8080',
      production: 'https://qualiopi.ch'
    }
  });

  const { loading: jsonTestLoading, testJsonFormat } = useJsonTest();
  const { 
    loading: configLoading, 
    lastError, 
    loadConfig, 
    saveConfig 
  } = useConfigOperations(config, setConfig);

  const handleInputChange = (
    section: 'api_urls' | 'allowed_origins',
    env: 'development' | 'production',
    value: string
  ) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [env]: value
      }
    }));
  };

  return {
    config,
    loading: jsonTestLoading || configLoading,
    lastError,
    loadConfig,
    saveConfig,
    handleInputChange,
    testJsonFormat
  };
};

export type { ApiConfig, JsonTestResult } from '@/types/api-config';
