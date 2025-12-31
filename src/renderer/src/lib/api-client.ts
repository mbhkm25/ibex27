// Web API Client Abstraction
// This file handles routing requests to either Electron IPC (window.api) or Web API (fetch)

const isElectron = typeof window !== 'undefined' && window.api !== undefined;

// Base API wrapper
const apiRequest = async (namespace: string, method: string, ...args: any[]) => {
  if (isElectron) {
    // Electron Mode: Use IPC Bridge
    if (!window.api[namespace] || !window.api[namespace][method]) {
      throw new Error(`API method ${namespace}.${method} not found in Electron bridge`);
    }
    return window.api[namespace][method](...args);
  } else {
    // Web Mode: Use Fetch to Serverless Functions
    // Example: /api/customer-portal/get-stores
    // We convert camelCase to kebab-case for URL if needed, or stick to a convention
    // For Vercel functions, we'll map methods to specific endpoints
    
    const endpoint = `/api/${namespace}/${method}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST', // Default to POST for most RPC-like calls
        headers: {
          'Content-Type': 'application/json',
          // Add auth token here if available in localStorage
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ args }), // Wrap args in an object
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Web API Error [${namespace}.${method}]:`, error);
      throw error;
    }
  }
};

// Create a proxy to mimic the window.api structure
const createApiProxy = () => {
  return new Proxy({}, {
    get: (_, namespace: string) => {
      return new Proxy({}, {
        get: (_, method: string) => {
          return (...args: any[]) => apiRequest(namespace, method, ...args);
        }
      });
    }
  });
};

// Export the API client
// If in Electron, this mimics window.api. If in Web, it calls fetch.
export const apiClient = isElectron ? window.api : createApiProxy() as any;

// Helper to check environment
export const isWebMode = !isElectron;
