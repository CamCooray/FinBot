// Environment configuration for API endpoints
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

// Configuration for different environments
const configs: Record<string, ApiConfig> = {
  development: {
    baseUrl: 'http://localhost:5001',
    timeout: 5000,
    retryAttempts: 2,
  },
  production: {
    baseUrl: 'https://finbot-k5bl.onrender.com',
    timeout: 10000,
    retryAttempts: 3,
  },
};

// Auto-detect environment or use override
export const getApiConfig = (): ApiConfig => {
  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
  
  const environment = isDevelopment ? 'development' : 'production';
  
  // Allow manual override via localStorage for testing
  const override = localStorage.getItem('finbot_api_override');
  if (override && configs[override]) {
    console.log(`🔧 Using API override: ${override} -> ${configs[override].baseUrl}`);
    return configs[override];
  }
  
  console.log(`🌐 Using ${environment} API: ${configs[environment].baseUrl}`);
  return configs[environment];
};

// Test if an API endpoint is reachable
export const testApiConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: 'OPTIONS',
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.warn(`API test failed for ${baseUrl}:`, error);
    return false;
  }
};

// Smart API selector - tries local first in development, then falls back
export const getAvailableApiConfig = async (): Promise<ApiConfig> => {
  const primaryConfig = getApiConfig();
  
  // Test primary configuration
  const isPrimaryAvailable = await testApiConnection(primaryConfig.baseUrl);
  if (isPrimaryAvailable) {
    return primaryConfig;
  }
  
  // If primary fails and we're in development, try production
  if (import.meta.env.DEV) {
    console.warn('🔄 Local API unavailable, trying production...');
    const fallbackConfig = configs.production;
    const isFallbackAvailable = await testApiConnection(fallbackConfig.baseUrl);
    
    if (isFallbackAvailable) {
      console.log('✅ Using production API as fallback');
      return fallbackConfig;
    }
  }
  
  // If production fails, try local as fallback
  if (!import.meta.env.DEV) {
    console.warn('🔄 Production API unavailable, trying local...');
    const fallbackConfig = configs.development;
    const isFallbackAvailable = await testApiConnection(fallbackConfig.baseUrl);
    
    if (isFallbackAvailable) {
      console.log('✅ Using local API as fallback');
      return fallbackConfig;
    }
  }
  
  // Return primary config even if unreachable (will handle errors gracefully)
  console.error('❌ No API endpoints are reachable');
  return primaryConfig;
};
