import React from 'react';

// Centralized API client for Contract Intelligence Engine
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface SystemStatus {
  status: string;
  service?: string;
  timestamp?: string;
  error?: string;
}

export interface BackendStatus {
  message: string;
}

export interface AnalysisRequest {
  document_text: string;
  analysis_type?: 'comprehensive' | 'clauses_only' | 'risk_only';
}

export interface AnalysisResponse {
  analysis?: any;
  clauses?: any[];
  risks?: any[];
  summary?: string;
}

export interface ClauseExtractionRequest {
  document_text: string;
}

export interface ClauseSearchRequest {
  query: string;
  limit?: number;
}

export interface RiskScoringRequest {
  clause_text: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // System status endpoints
  async getBackendStatus(): Promise<BackendStatus> {
    return this.request<BackendStatus>('/');
  }

  async getSystemHealth(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/health');
  }

  async getLegalAgentHealth(): Promise<SystemStatus> {
    return this.request<SystemStatus>('/legal-agent/health');
  }

  // Legal agent endpoints
  async analyzeDocument(request: AnalysisRequest): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/legal-agent/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async extractClauses(request: ClauseExtractionRequest): Promise<any> {
    return this.request('/legal-agent/extract-clauses', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async searchClauses(request: ClauseSearchRequest): Promise<any> {
    return this.request('/legal-agent/search-clauses', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async scoreRisk(request: RiskScoringRequest): Promise<any> {
    return this.request('/legal-agent/score-risk', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getSystemStats(): Promise<any> {
    return this.request('/legal-agent/stats');
  }

  async comprehensiveAnalysis(request: ClauseExtractionRequest): Promise<any> {
    return this.request('/legal-agent/comprehensive-analysis', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Contract endpoints
  async uploadContract(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request('/contracts', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it with boundary
      body: formData,
    });
  }

  async getContracts(cursor?: string): Promise<any> {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    return this.request(`/contracts${params}`);
  }

  async analyzeContract(contractId: string, options?: { sections?: string[]; filePath?: string }): Promise<any> {
    return this.request(`/contracts/${contractId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getJobStatus(jobId: string): Promise<any> {
    return this.request(`/status/${jobId}`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// React hooks for API calls with loading states and error handling
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): ApiResponse<T> {
  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isCancelled = false;

    const executeCall = async () => {
      try {
        setLoading(true);
        setError(undefined);
        const result = await apiCall();
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    executeCall();

    return () => {
      isCancelled = true;
    };
  }, dependencies);

  return { data, error, loading };
}

// Specific hooks for common operations
export function useBackendStatus() {
  return useApiCall(() => apiClient.getBackendStatus());
}

export function useSystemHealth() {
  return useApiCall(() => apiClient.getSystemHealth());
}

export function useLegalAgentHealth() {
  return useApiCall(() => apiClient.getLegalAgentHealth());
}

export function useSystemStats() {
  return useApiCall(() => apiClient.getSystemStats());
}

export function useContracts(cursor?: string) {
  return useApiCall(() => apiClient.getContracts(cursor), [cursor]);
}

// Utility function for manual API calls with error handling
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  onError?: (error: string) => void
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    if (onError) {
      onError(errorMessage);
    }
    return null;
  }
}
