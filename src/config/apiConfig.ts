
// API Configuration

// Define environment-specific API URLs using Vite environment variables
let apiUrl = '/api'; // Default to relative path if not specified

// Determine the API URL based on the current environment
if (import.meta.env.MODE === 'development') {
  apiUrl = import.meta.env.VITE_API_URL_DEV || '/api';
  console.log("Using development API URL:", apiUrl);
} else {
  apiUrl = import.meta.env.VITE_API_URL_PROD || '/api';
  console.log("Using production API URL:", apiUrl);
}

// Export the API URL getter function
export const getApiUrl = (): string => {
  return apiUrl;
};

// Test API connection function
export const testApiConnection = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("Testing API connection to:", apiUrl);
    
    // Utilisons login-test.php au lieu de test.php qui renvoie toujours 404
    const response = await fetch(`${apiUrl}/login-test.php`, {
      method: 'GET', // Utiliser GET pour le test au lieu de POST
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'same-origin',
      mode: 'cors',
    });

    console.log("API test response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API connection test failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API test response data:", data);
    
    return {
      success: true,
      message: data.message || 'API connection successful',
    };
  } catch (error) {
    console.error("API connection test error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during API connection test',
    };
  }
};

// Utility function for API fetch with error handling
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {}
): Promise<any> => {
  try {
    // Log the full URL being used for the API call
    console.log(`API call to: ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      credentials: 'same-origin',
      mode: 'cors',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`API error for ${url}:`, error);
    throw error;
  }
};

// Export constants related to API paths
export const API_ROUTES = {
  LOGIN: `${apiUrl}/login-test.php`,
  TEST: `${apiUrl}/login-test.php`, // Utiliser login-test.php au lieu de test.php
  USERS: `${apiUrl}/utilisateurs.php`,
  DATABASE_TEST: `${apiUrl}/database-test.php`,
};

// Export API configuration object
export const apiConfig = {
  baseUrl: apiUrl,
  routes: API_ROUTES,
  getFullUrl: (path: string) => `${apiUrl}${path}`,
};
