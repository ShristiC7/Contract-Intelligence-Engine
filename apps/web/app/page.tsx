'use client';

import { useState, useEffect } from 'react';

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

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch backend status
        const backendResponse = await fetch(`${API_BASE}/`);
        const backendData = await backendResponse.json();
        setBackendStatus(backendData);

        // Fetch legal agent health
        const healthResponse = await fetch(`${API_BASE}/legal-agent/health`);
        const healthData = await healthResponse.json();
        setSystemStatus(healthData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch system status');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemStatus();
  }, [API_BASE]);

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
      </div>
    </main>
  );
}

