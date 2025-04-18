
import React from 'react';
import { useApiStatusCheck } from '@/hooks/useApiStatusCheck';

export const ApiStatus = () => {
  const { apiStatus, apiMessage, retestApi } = useApiStatusCheck();

  return (
    <>
      {apiStatus === 'checking' && (
        <p className="text-sm text-amber-600 mt-2 mb-2 flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Vérification de la connexion à l'API...
        </p>
      )}
      
      {apiStatus === 'available' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mt-2 mb-2 text-sm flex items-center">
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {apiMessage}
        </div>
      )}
      
      {apiStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mt-2 mb-2 text-sm flex flex-col">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>API joignable mais renvoie une erreur</span>
          </div>
          <p className="text-xs mt-1 pl-6">{apiMessage}</p>
        </div>
      )}
      
      <button 
        onClick={retestApi}
        className="text-xs text-blue-600 hover:text-blue-800 underline mb-4"
      >
        Tester la connexion à l'API
      </button>
    </>
  );
};
