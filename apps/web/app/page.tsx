'use client';

import { useState, useEffect } from 'react';
import { apiClient, useBackendStatus, useLegalAgentHealth, withErrorHandling } from '../lib/api';

interface SystemStatus {
  status: string;
  service?: string;
  timestamp?: string;
}

interface BackendStatus {
  message: string;
}

export default function Page() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testAnalysisResult, setTestAnalysisResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch backend status using centralized API client
        const backendData = await withErrorHandling(
          () => apiClient.getBackendStatus(),
          (err) => setError(`Backend error: ${err}`)
        );
        if (backendData) {
          setBackendStatus(backendData);
        }

        // Fetch legal agent health using centralized API client
        const healthData = await withErrorHandling(
          () => apiClient.getLegalAgentHealth(),
          (err) => setError(`Legal agent error: ${err}`)
        );
        if (healthData) {
          setSystemStatus(healthData);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch system status');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const testAnalysis = async () => {
    setTestLoading(true);
    try {
      const result = await withErrorHandling(
        () => apiClient.analyzeDocument({
          document_text: "This is a test contract for analysis. It contains various clauses and terms that need to be analyzed for legal compliance and risk assessment.",
          analysis_type: 'comprehensive'
        }),
        (err) => setError(`Analysis error: ${err}`)
      );
      setTestAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      minHeight: '100dvh',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>
        Contract Intelligence Engine - Web
      </h1>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
        maxWidth: '600px',
        width: '100%'
      }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#666' }}>
            Loading system status...
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            Error: {error}
          </div>
        )}

        {backendStatus && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#efe', 
            border: '1px solid #cfc',
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#363' }}>Backend Status</h3>
            <p style={{ margin: 0, color: '#363' }}>{backendStatus.message}</p>
          </div>
        )}

        {systemStatus && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: systemStatus.status === 'healthy' ? '#efe' : '#ffe', 
            border: `1px solid ${systemStatus.status === 'healthy' ? '#cfc' : '#fcc'}`,
            borderRadius: '4px'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: systemStatus.status === 'healthy' ? '#363' : '#c63' }}>
              Legal Agent Status
            </h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Status: <strong>{systemStatus.status}</strong>
            </p>
            {systemStatus.service && (
              <p style={{ margin: '0 0 0.5rem 0' }}>
                Service: {systemStatus.service}
              </p>
            )}
            {systemStatus.timestamp && (
              <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
                Last checked: {new Date(systemStatus.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>API Configuration</h3>
          <p style={{ margin: 0, fontSize: '0.9em', color: '#666' }}>
            API Base URL: <code>{API_BASE}</code>
          </p>
        </div>

        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#e3f2fd', 
          border: '1px solid #bbdefb',
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Integration Test</h3>
          <button 
            onClick={testAnalysis}
            disabled={testLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: testLoading ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: testLoading ? 'not-allowed' : 'pointer',
              marginBottom: '1rem'
            }}
          >
            {testLoading ? 'Testing Analysis...' : 'Test Document Analysis'}
          </button>
          
          {testAnalysisResult && (
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#f5f5f5', 
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Analysis Result:</h4>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(testAnalysisResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

